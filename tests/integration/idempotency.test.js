// Integration tests for idempotency middleware
// Tests duplicate request handling and key expiration

const request = require('supertest');
const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { db } = require('../../shared/database.js');
const app = require('../../api/app.js'); // Assuming we have an Express app

describe('Idempotency Middleware Integration Tests', () => {
  let testUserId;
  let testLotId;
  let authToken;
  
  beforeEach(async () => {
    // Setup test data
    testUserId = 'test-user-' + Date.now();
    testLotId = 'test-lot-' + Date.now();
    authToken = 'test-auth-token';
    
    // Clean up any existing idempotency keys
    await db.query('DELETE FROM idempotencyKeys WHERE userId = $1', [testUserId]);
  });
  
  afterEach(async () => {
    // Cleanup test data
    await db.query('DELETE FROM idempotencyKeys WHERE userId = $1', [testUserId]);
    await db.query('DELETE FROM orders WHERE buyerId = $1', [testUserId]);
  });
  
  describe('Buy Order Idempotency', () => {
    const buyOrderData = {
      action: 'buy',
      lotId: 'test-lot-123',
      buyerId: 'test-buyer-123',
      tons: 10,
      pricePerTon: 50
    };
    
    it('should process first request normally', async () => {
      const idempotencyKey = 'test-key-' + Date.now();
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(buyOrderData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      // Verify idempotency key was stored
      const storedKey = await db.query(
        'SELECT * FROM idempotencyKeys WHERE idempotencyKey = $1',
        [idempotencyKey]
      );
      expect(storedKey.rows).toHaveLength(1);
    });
    
    it('should return cached response for duplicate request', async () => {
      const idempotencyKey = 'test-key-duplicate-' + Date.now();
      
      // First request
      const firstResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(buyOrderData)
        .expect(200);
      
      // Duplicate request with same idempotency key
      const secondResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(buyOrderData)
        .expect(200);
      
      // Should return same response
      expect(secondResponse.body).toEqual(firstResponse.body);
      
      // Should only have one order created
      const orders = await db.query(
        'SELECT * FROM orders WHERE buyerId = $1',
        [buyOrderData.buyerId]
      );
      expect(orders.rows).toHaveLength(1);
    });
    
    it('should reject request without idempotency key', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(buyOrderData)
        .expect(400);
      
      expect(response.body.error).toContain('Idempotency key required');
    });
    
    it('should handle different request bodies with same key', async () => {
      const idempotencyKey = 'test-key-different-body-' + Date.now();
      
      // First request
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(buyOrderData)
        .expect(200);
      
      // Different request body with same key
      const differentData = { ...buyOrderData, tons: 20 };
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(differentData)
        .expect(409);
      
      expect(response.body.error).toContain('Request body mismatch');
    });
  });
  
  describe('Deposit Idempotency', () => {
    const depositData = {
      action: 'deposit',
      amount: 1000,
      userId: 'test-investor-123'
    };
    
    it('should process deposit with idempotency key', async () => {
      const idempotencyKey = 'deposit-key-' + Date.now();
      
      const response = await request(app)
        .post('/api/investor')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(depositData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('should prevent duplicate deposits', async () => {
      const idempotencyKey = 'deposit-duplicate-' + Date.now();
      
      // First deposit
      const firstResponse = await request(app)
        .post('/api/investor')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(depositData)
        .expect(200);
      
      // Duplicate deposit
      const secondResponse = await request(app)
        .post('/api/investor')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(depositData)
        .expect(200);
      
      // Should return cached response
      expect(secondResponse.body).toEqual(firstResponse.body);
    });
  });
  
  describe('Withdraw Idempotency', () => {
    const withdrawData = {
      action: 'withdraw',
      amount: 500,
      userId: 'test-investor-123'
    };
    
    it('should process withdraw with idempotency key', async () => {
      const idempotencyKey = 'withdraw-key-' + Date.now();
      
      const response = await request(app)
        .post('/api/investor')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(withdrawData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Dispute Resolution Idempotency', () => {
    const disputeData = {
      action: 'dispute',
      userId: 'test-user-123',
      reason: 'Quality issues with delivered carbon credits'
    };
    
    const resolveData = {
      action: 'resolve',
      adminId: 'test-admin-123',
      decision: 'settle'
    };
    
    it('should handle dispute creation with idempotency', async () => {
      const idempotencyKey = 'dispute-key-' + Date.now();
      
      const response = await request(app)
        .put('/api/orders/test-order-123')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(disputeData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('should handle dispute resolution with idempotency', async () => {
      const idempotencyKey = 'resolve-key-' + Date.now();
      
      const response = await request(app)
        .put('/api/orders/test-order-123')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(resolveData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('File Upload Idempotency', () => {
    const uploadData = {
      lotId: 'test-lot-123',
      projectId: 'test-project-123',
      type: 'CARBON_CERTIFICATE',
      title: 'Test Certificate',
      description: 'Test upload',
      fileContent: 'dGVzdCBmaWxlIGNvbnRlbnQ=', // base64 encoded "test file content"
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      userId: 'test-user-123'
    };
    
    it('should handle file upload with idempotency', async () => {
      const idempotencyKey = 'upload-key-' + Date.now();
      
      const response = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(uploadData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.fileId).toBeDefined();
    });
    
    it('should prevent duplicate file uploads', async () => {
      const idempotencyKey = 'upload-duplicate-' + Date.now();
      
      // First upload
      const firstResponse = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(uploadData)
        .expect(200);
      
      // Duplicate upload
      const secondResponse = await request(app)
        .post('/api/proofs/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send(uploadData)
        .expect(200);
      
      // Should return same file ID
      expect(secondResponse.body.data.fileId).toBe(firstResponse.body.data.fileId);
    });
  });
  
  describe('Key Expiration', () => {
    it('should allow reuse of expired keys', async () => {
      const idempotencyKey = 'expired-key-' + Date.now();
      
      // Insert expired key manually
      await db.query(`
        INSERT INTO idempotencyKeys (
          idempotencyKey, requestHash, endpoint, method, 
          responseData, statusCode, userId, expiresAt, createdAt
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        idempotencyKey,
        'old-hash',
        '/api/orders',
        'POST',
        JSON.stringify({ old: 'response' }),
        200,
        testUserId,
        new Date(Date.now() - 1000), // Expired 1 second ago
        new Date(Date.now() - 3600000) // Created 1 hour ago
      ]);
      
      // Should allow new request with expired key
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send({
          action: 'buy',
          lotId: 'test-lot-456',
          buyerId: 'test-buyer-456',
          tons: 5,
          pricePerTon: 60
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Cleanup Function', () => {
    it('should clean up expired keys', async () => {
      // Insert some expired keys
      const expiredKeys = [
        'expired-1-' + Date.now(),
        'expired-2-' + Date.now(),
        'expired-3-' + Date.now()
      ];
      
      for (const key of expiredKeys) {
        await db.query(`
          INSERT INTO idempotencyKeys (
            idempotencyKey, requestHash, endpoint, method,
            responseData, statusCode, userId, expiresAt, createdAt
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          key,
          'hash',
          '/api/test',
          'POST',
          '{}',
          200,
          testUserId,
          new Date(Date.now() - 1000), // Expired
          new Date(Date.now() - 3600000)
        ]);
      }
      
      // Import and run cleanup function
      const { cleanupExpiredKeys } = require('../../api/middleware/idempotency.js');
      await cleanupExpiredKeys();
      
      // Check that expired keys were removed
      const remainingKeys = await db.query(
        'SELECT * FROM idempotencyKeys WHERE idempotencyKey = ANY($1)',
        [expiredKeys]
      );
      expect(remainingKeys.rows).toHaveLength(0);
    });
  });
});