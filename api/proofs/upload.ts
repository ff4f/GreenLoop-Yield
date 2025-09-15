import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

// @ts-ignore
import { MOCK_IDS, ProofType, ProofLink, calcPDI, canTransitionLotStatus, LotStatus } from '../../shared/schema.js';
// @ts-ignore
import { HederaMockService } from '../../shared/hedera-mock.js';
// @ts-ignore
import { HederaRealService } from '../../shared/hedera-real.js';
// @ts-ignore
import { idempotencyMiddleware, requireIdempotencyKey } from '../middleware/idempotency.js';

// Use real or mock service based on environment
const HederaService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;

// Validation schema for proof upload
const uploadProofSchema = z.object({
  lotId: z.string().optional(),
  projectId: z.string().optional(),
  type: z.enum([ProofType.PHOTO, ProofType.NDVI, ProofType.QC]),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  fileContent: z.string(), // Base64 encoded file content
  fileName: z.string(),
  fileType: z.string(),
  userId: z.string()
}).refine(data => data.lotId || data.projectId, {
  message: "Either lotId or projectId must be provided"
});

// Helper functions
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function validateFileType(fileName: string, fileType: string): boolean {
  const allowedTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf']
  };
  
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return Object.entries(allowedTypes).some(([type, extensions]) => 
    fileType === type && extensions.includes(extension)
  );
}

function validateFileSize(fileContent: string): boolean {
  const fileSizeBytes = Buffer.byteLength(fileContent, 'base64');
  return fileSizeBytes <= 1024 * 1024; // 1MB limit
}

function logAnalytics(event: string, value: number, metadata: any) {
  console.log('Analytics:', { event, value, metadata, timestamp: new Date().toISOString() });
}

function logAudit(userId: string, action: string, resourceType: string, resourceId: string, metadata: any) {
  console.log('Audit:', {
    userId,
    action,
    resourceType,
    resourceId,
    metadata,
    timestamp: new Date().toISOString()
  });
}

// Mock database operations (replace with real DB in production)
let mockProofs: any[] = [];
let mockLots: any[] = [
  { id: 'lot-001', status: 'draft', projectId: 'proj-001' },
  { id: 'lot-002', status: 'draft', projectId: 'proj-002' }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply idempotency middleware for upload operation
  await new Promise((resolve, reject) => {
    idempotencyMiddleware(req, res, (err: any) => {
      if (err) reject(err);
      else resolve(null);
    });
  });
  
  // Require idempotency key for upload operation
  const idempotencyCheck = requireIdempotencyKey(req, res, () => {});
  if (idempotencyCheck) return;

  try {
    // Validate request body
    const validationResult = uploadProofSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
        toast: {
          type: 'error',
          message: 'Invalid upload data. Please check your inputs.'
        }
      });
    }

    const { lotId, projectId, type, title, description, fileContent, fileName, fileType, userId } = validationResult.data;
      
      // Validate file type
      if (!validateFileType(fileName as string, fileType as string)) {
      return res.status(400).json({
        error: 'Invalid file type',
        toast: {
          type: 'error',
          message: 'Only JPG, PNG, and PDF files are allowed.'
        }
      });
    }

    // Validate file size
      if (!validateFileSize(fileContent as string)) {
      return res.status(400).json({
        error: 'File size exceeds 1MB limit',
        toast: {
          type: 'error',
          message: 'File size must be less than 1MB.'
        }
      });
    }

    // Simulate Hedera operations
    await HederaService.simulateNetworkDelay(2500);

    // Step 1: Upload file to Hedera File Service
    const fileUpload = await HederaService.file.uploadFile(
      fileContent as string,
      fileType as string
    );

    // Step 2: Create manifest.json
    const manifest = {
      proofId: generateId('proof'),
      lotId: lotId || null,
      projectId: projectId || null,
      type,
      title,
      description: description || '',
      originalFileName: fileName,
      fileType,
      fileId: fileUpload.fileId,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      status: 'pending',
      version: '1.0'
    };

    // Step 3: Upload manifest to HFS
    const manifestUpload = await HederaService.file.uploadFile(
      JSON.stringify(manifest, null, 2) as string,
      'application/json'
    );

    // Step 4: Save proof to database
    const proof = {
      id: manifest.proofId,
      projectId: projectId || null,
      lotId: lotId || null,
      type,
      title,
      description: description || '',
      imageUrl: null, // Will be set after verification
      fileId: fileUpload.fileId,
      manifestFileId: manifestUpload.fileId,
      proofHash: fileUpload.fileHash || generateId('hash'),
      hcsTopicId: null, // Will be set after HCS submission
      hcsTransactionId: null,
      submittedBy: userId,
      status: 'pending',
      metadata: {
        originalFileName: fileName,
        fileType,
        fileSize: Buffer.byteLength(fileContent as string, 'base64'),
        manifestVersion: '1.0'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockProofs.push(proof);

    // Step 5: Publish event to HCS topic
    const hcsMessage = {
      eventType: 'gly.proof',
      proofId: proof.id,
      lotId: lotId || null,
      projectId: projectId || null,
      type,
      fileId: fileUpload.fileId,
      manifestFileId: manifestUpload.fileId,
      submittedBy: userId,
      timestamp: new Date().toISOString()
    };

    const hcsSubmission = await HederaService.consensus.submitMessage(
      MOCK_IDS.HCS_TOPICS.PROOF,
      JSON.stringify(hcsMessage) as string
    );

    // Update proof with HCS info
    proof.hcsTopicId = MOCK_IDS.HCS_TOPICS.PROOF;
    proof.hcsTransactionId = hcsSubmission.transactionId;
    proof.updatedAt = new Date().toISOString();

    // Step 6: Calculate PDI and update lot status if applicable
    if (lotId) {
      const lotProofs = mockProofs.filter(p => p.lotId === lotId);
      const pdi = calcPDI(lotProofs);
      
      // Find lot and update status if needed
      const lot = mockLots.find(l => l.id === lotId);
      if (lot && lot.status === LotStatus.DRAFT && pdi > 0) {
        if (canTransitionLotStatus(lot.status, 'proofed')) {
          lot.status = 'proofed';
          lot.pdi = pdi;
          lot.updatedAt = new Date().toISOString();
        }
      }
    }

    // Log analytics and audit
    logAnalytics('proof_uploaded', 1, {
      proofId: proof.id,
      type,
      fileId: fileUpload.fileId,
      lotId: lotId || null,
      projectId: projectId || null,
      userId
    });

    logAudit(userId as string, 'upload_proof', 'proof', proof.id, {
      type,
      fileName,
      fileId: fileUpload.fileId,
      manifestFileId: manifestUpload.fileId,
      hcsTransactionId: hcsSubmission.transactionId
    });

    return res.status(201).json({
      success: true,
      data: {
        proofId: proof.id,
        fileId: fileUpload.fileId,
        manifestFileId: manifestUpload.fileId,
        hcsTransactionId: hcsSubmission.transactionId,
        status: proof.status,
        uploadedAt: proof.createdAt
      },
      proofOutputs: {
        fileId: fileUpload.fileId,
        manifestFileId: manifestUpload.fileId,
        hcsTransactionId: hcsSubmission.transactionId,
        topicId: MOCK_IDS.HCS_TOPICS.PROOF,
        status: 'Proof uploaded and published to HCS successfully'
      },
      proofLinks: {
        file: ProofLink.buildFileLink(fileUpload.fileId),
        manifest: ProofLink.buildFileLink(manifestUpload.fileId),
        hcsTransaction: ProofLink.buildTransactionLink(hcsSubmission.transactionId),
        topic: ProofLink.buildTopicLink(MOCK_IDS.HCS_TOPICS.PROOF)
      },
      toast: {
        type: 'success',
        message: `${(type as string).toUpperCase()} proof uploaded successfully!`,
        links: [
          {
            text: 'View File',
            url: ProofLink.buildFileLink(fileUpload.fileId)
          },
          {
            text: 'View HCS Transaction',
            url: ProofLink.buildTransactionLink(hcsSubmission.transactionId)
          }
        ]
      }
    });

  } catch (error) {
    console.error('Proof upload error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      toast: {
        type: 'error',
        message: 'Failed to upload proof. Please try again.'
      }
    });
  }
}