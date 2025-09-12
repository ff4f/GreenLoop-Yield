import { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import { HederaRealService } from '../shared/hedera-real.js';
// @ts-ignore
import { HederaMockService } from '../shared/hedera-mock.js';
// @ts-ignore
import { ProofType, UserRole, buildProofLink } from '../shared/schema.js';

// Use real or mock service based on environment
const HederaService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;
// @ts-ignore
import { db, QueryHelpers } from '../shared/database.js';
// @ts-ignore
import formidable from 'formidable';
import fs from 'fs/promises';

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

async function logAnalytics(event: string, metadata: any) {
  const entry = {
    id: generateId(),
    event,
    metadata,
    timestamp: new Date().toISOString(),
    userId: metadata.userId || 'anonymous'
  };
  await QueryHelpers.createAnalytics(entry);
}

async function logAudit(action: string, entityType: string, entityId: string, userId: string, changes: any) {
  const entry = {
    id: generateId(),
    action,
    entityType,
    entityId,
    userId,
    changes,
    timestamp: new Date().toISOString()
  };
  await QueryHelpers.createAuditLog(entry);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query, body } = req;
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  const userRole = req.headers['x-user-role'] as UserRole || UserRole.DEVELOPER;

  try {
    switch (method) {
      case 'GET':
        // Get proofs with optional filtering
        const { lotId, projectId, type, limit = '50' } = query;
        let filteredProofs = await QueryHelpers.getProofs();

        if (lotId) {
          filteredProofs = filteredProofs.filter((p: any) => p.lotId === lotId);
        }
        if (projectId) {
          filteredProofs = filteredProofs.filter((p: any) => p.projectId === projectId);
        }
        if (type) {
          filteredProofs = filteredProofs.filter((p: any) => p.type === type);
        }

        // Sort by timestamp descending (timeline order)
        filteredProofs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Apply limit
        filteredProofs = filteredProofs.slice(0, parseInt(limit as string));

        // Log analytics
        await logAnalytics('proof_feed_viewed', {
          userId,
          filters: { lotId, projectId, type },
          resultCount: filteredProofs.length
        });

        return res.status(200).json({
          success: true,
          data: filteredProofs,
          meta: {
            total: filteredProofs.length,
            filters: { lotId, projectId, type }
          }
        });

      case 'POST':
        // Handle multipart form data for file uploads
        let formData;
        let uploadedFile = null;
        
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          const form = formidable({
            maxFileSize: 10 * 1024 * 1024, // 10MB limit
            allowEmptyFiles: false,
            filter: ({ mimetype }: any) => {
               return mimetype && (
                 mimetype.includes('image/') ||
                 mimetype.includes('application/pdf') ||
                 mimetype.includes('application/json')
               );
             }
          });
          
          const [fields, files] = await form.parse(req);
          formData = {
            lotId: fields.lotId?.[0],
            projectId: fields.projectId?.[0],
            type: fields.type?.[0],
            title: fields.title?.[0],
            description: fields.description?.[0]
          };
          
          if (files.file?.[0]) {
            uploadedFile = files.file[0];
          }
        } else {
          formData = body;
        }
        
        const { lotId: newLotId, projectId: newProjectId, type: proofType, title, description } = formData;

        // Validation
        if (!newLotId || !newProjectId || !proofType || !title) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: lotId, projectId, type, title'
          });
        }

        if (!Object.values(ProofType).includes(proofType)) {
          return res.status(400).json({
            success: false,
            error: `Invalid proof type. Must be one of: ${Object.values(ProofType).join(', ')}`
          });
        }

        // Role-based access control
        if (userRole !== UserRole.DEVELOPER && userRole !== UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions. Only Developers and Admins can add proofs.'
          });
        }

        try {
          // Use real Hedera service or mock based on environment
          const useRealHedera = process.env.NODE_ENV === 'production' || process.env.USE_REAL_HEDERA === 'true';
          const hederaService = HederaService;
          
          // Upload file to HFS (if file provided)
          let fileId = null;
          let fileSize = 0;
          
          if (uploadedFile) {
            try {
              // Read file content
              const fileContent = await fs.readFile(uploadedFile.filepath);
              fileSize = fileContent.length;
              
              // Upload to Hedera File Service
              const uploadResult = await hederaService.file.uploadFile(
                fileContent, 
                `${proofType}-${title}-${Date.now()}`
              );
              
              fileId = uploadResult.fileId;
              
              // Clean up temporary file
              await fs.unlink(uploadedFile.filepath).catch(() => {});
            } catch (fileError: any) {
               console.error('File upload error:', fileError);
               throw new Error(`Failed to upload file: ${fileError.message}`);
             }
          }

          // Submit to HCS topic
          const messageData = {
            type: 'PROOF_ADDED',
            lotId: newLotId,
            projectId: newProjectId,
            proofType,
            title,
            description,
            fileId,
            fileSize,
            timestamp: new Date().toISOString(),
            submittedBy: userId
          };
          
          const consensusResult = await hederaService.consensus.submitMessage(
            'PROOF_TOPIC',
            JSON.stringify(messageData)
          );

          // Create new proof
          const newProof = {
            id: generateId(),
            lotId: newLotId,
            projectId: newProjectId,
            type: proofType,
            title,
            description,
            fileId,
            topicId: consensusResult.topicId,
            sequenceNumber: consensusResult.sequenceNumber,
            timestamp: new Date().toISOString(),
            submittedBy: userId,
            verified: false
          };

          await QueryHelpers.createProof(newProof);

          // Log analytics and audit
          await logAnalytics('proof_added', {
            userId,
            proofId: newProof.id,
            lotId: newLotId,
            projectId: newProjectId,
            type: proofType
          });

          await logAudit('CREATE', 'proof', newProof.id, userId, {
            lotId: newLotId,
            projectId: newProjectId,
            type: proofType,
            title,
            fileId,
            topicId: consensusResult.topicId
          });

          // Build proof links for response
          const proofLinks = {
            file: fileId ? buildProofLink('file', fileId) : null,
            topic: buildProofLink('topic', `${consensusResult.topicId}#${consensusResult.sequenceNumber}`)
          };

          return res.status(201).json({
            success: true,
            data: newProof,
            proofLinks,
            toast: {
              type: 'success',
              title: 'Proof Added Successfully',
              message: `${proofType} proof "${title}" has been submitted to Hedera network`,
              links: proofLinks
            }
          });

        } catch (hederaError: any) {
          console.error('Hedera operation failed:', hederaError);
          return res.status(500).json({
            success: false,
            error: 'Failed to submit proof to Hedera network',
            details: hederaError.message
          });
        }

      case 'PUT':
        // Update proof (verify/unverify)
        const proofId = query.id as string;
        const { verified } = body;

        if (!proofId) {
          return res.status(400).json({
            success: false,
            error: 'Proof ID is required'
          });
        }

        // Role-based access control for verification
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.AUDITOR) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions. Only Admins and Auditors can verify proofs.'
          });
        }

        const existingProof = await QueryHelpers.getProofById(proofId);
        if (!existingProof) {
          return res.status(404).json({
            success: false,
            error: 'Proof not found'
          });
        }

        const oldVerified = existingProof.verified;
        const updatedProof = {
          ...existingProof,
          verified,
          verifiedBy: verified ? userId : null,
          verifiedAt: verified ? new Date().toISOString() : null
        };
        await QueryHelpers.updateProof(proofId, updatedProof);

        // Log analytics and audit
        await logAnalytics('proof_verification_changed', {
          userId,
          proofId,
          verified,
          previousState: oldVerified
        });

        await logAudit('UPDATE', 'proof', proofId, userId, {
          verified: { from: oldVerified, to: verified },
          verifiedBy: verified ? userId : null
        });

        return res.status(200).json({
          success: true,
          data: updatedProof,
          toast: {
            type: 'success',
            title: verified ? 'Proof Verified' : 'Proof Unverified',
            message: `Proof "${updatedProof.title}" has been ${verified ? 'verified' : 'unverified'}`
          }
        });

      case 'DELETE':
        // Delete proof (admin only)
        const deleteProofId = query.id as string;

        if (!deleteProofId) {
          return res.status(400).json({
            success: false,
            error: 'Proof ID is required'
          });
        }

        // Role-based access control
        if (userRole !== UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions. Only Admins can delete proofs.'
          });
        }

        const proofToDelete = await QueryHelpers.getProofById(deleteProofId);
        if (!proofToDelete) {
          return res.status(404).json({
            success: false,
            error: 'Proof not found'
          });
        }

        await QueryHelpers.deleteProof(deleteProofId);

        // Log analytics and audit
        await logAnalytics('proof_deleted', {
          userId,
          proofId: deleteProofId,
          lotId: proofToDelete.lotId,
          projectId: proofToDelete.projectId
        });

        await logAudit('DELETE', 'proof', deleteProofId, userId, {
          deletedProof: {
            title: proofToDelete.title,
            type: proofToDelete.type,
            lotId: proofToDelete.lotId,
            projectId: proofToDelete.projectId
          }
        });

        return res.status(200).json({
          success: true,
          message: 'Proof deleted successfully',
          toast: {
            type: 'success',
            title: 'Proof Deleted',
            message: `Proof "${proofToDelete.title}" has been deleted`
          }
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`
        });
    }
  } catch (error: any) {
    console.error('Proof feed API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}