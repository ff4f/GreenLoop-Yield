import crypto from 'crypto';
import { db } from '../../shared/database.js';
import { idempotencyKeys } from '../../shared/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware untuk menangani x-idempotency-key
 * Mencegah duplikasi request dengan menyimpan key + hash request body + timestamp
 */
export const idempotencyMiddleware = async (req, res, next) => {
  // Hanya terapkan pada method POST dan PUT
  if (!['POST', 'PUT'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['x-idempotency-key'];
  
  // Jika tidak ada idempotency key, lanjutkan tanpa middleware
  if (!idempotencyKey) {
    return next();
  }

  try {
    // Hash request body untuk perbandingan
    const requestBody = JSON.stringify(req.body || {});
    const requestHash = crypto.createHash('sha256').update(requestBody).digest('hex');
    
    const endpoint = req.path;
    const method = req.method;
    const userId = req.user?.id || null;
    
    // Cek apakah ada entry dengan idempotency key yang sama
    const existingEntry = await db
      .select()
      .from(idempotencyKeys)
      .where(
        and(
          eq(idempotencyKeys.idempotencyKey, idempotencyKey),
          gt(idempotencyKeys.expiresAt, new Date()) // Belum expired
        )
      )
      .limit(1);

    if (existingEntry.length > 0) {
      const entry = existingEntry[0];
      
      // Jika hash request sama, kembalikan response yang sudah disimpan
      if (entry.requestHash === requestHash && entry.endpoint === endpoint && entry.method === method) {
        return res.status(entry.statusCode || 200).json(entry.responseData);
      }
      
      // Jika hash berbeda, tolak dengan 409 Conflict
      if (entry.requestHash !== requestHash) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Request with same idempotency key but different body already exists',
          code: 'IDEMPOTENCY_CONFLICT'
        });
      }
    }

    // Simpan informasi request untuk digunakan setelah response
    req.idempotencyData = {
      key: idempotencyKey,
      hash: requestHash,
      endpoint,
      method,
      userId
    };

    // Override res.json untuk menyimpan response
    const originalJson = res.json;
    res.json = function(data) {
      // Simpan response ke database
      saveIdempotencyResponse(req.idempotencyData, data, res.statusCode);
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    // Jika ada error di middleware, lanjutkan tanpa blocking request
    next();
  }
};

/**
 * Simpan response ke database untuk idempotency
 */
async function saveIdempotencyResponse(idempotencyData, responseData, statusCode) {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire dalam 24 jam

    await db.insert(idempotencyKeys).values({
      id: uuidv4(),
      idempotencyKey: idempotencyData.key,
      requestHash: idempotencyData.hash,
      endpoint: idempotencyData.endpoint,
      method: idempotencyData.method,
      responseData,
      statusCode,
      userId: idempotencyData.userId,
      expiresAt
    });
  } catch (error) {
    console.error('Error saving idempotency response:', error);
  }
}

/**
 * Cleanup expired idempotency keys
 */
export async function cleanupExpiredKeys() {
  try {
    const now = new Date();
    await db
      .delete(idempotencyKeys)
      .where(gt(now, idempotencyKeys.expiresAt));
  } catch (error) {
    console.error('Error cleaning up expired idempotency keys:', error);
  }
}

/**
 * Middleware khusus untuk endpoint sensitif yang memerlukan idempotency key
 */
export const requireIdempotencyKey = (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  
  if (!idempotencyKey) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'x-idempotency-key header is required for this endpoint',
      code: 'MISSING_IDEMPOTENCY_KEY'
    });
  }
  
  // Validasi format idempotency key (UUID atau string minimal 16 karakter)
  if (idempotencyKey.length < 16) {
    return res.status(400).json({
      error: 'Bad Request', 
      message: 'x-idempotency-key must be at least 16 characters long',
      code: 'INVALID_IDEMPOTENCY_KEY'
    });
  }
  
  next();
};