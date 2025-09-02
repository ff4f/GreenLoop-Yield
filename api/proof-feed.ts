import { VercelRequest, VercelResponse } from '@vercel/node';
import { HederaMockService } from '../shared/hedera-mock.js';
import { ProofType, UserRole, buildProofLink } from '../shared/schema.js';
import { db, QueryHelpers } from '../shared/database.js';

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
          filteredProofs = filteredProofs.filter(p => p.lotId === lotId);
        }
        if (projectId) {
          filteredProofs = filteredProofs.filter(p => p.projectId === projectId);
        }
        if (type) {
          filteredProofs = filteredProofs.filter(p => p.type === type);
        }

        // Sort by timestamp descending (timeline order)
        filteredProofs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
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
        // Add new proof
        const { lotId: newLotId, projectId: newProjectId, type: proofType, title, description, file } = body;

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
          // Use Hedera Mock Service for file upload and consensus
          const hederaService = new HederaMockService();
          
          // Upload file to HFS (if file provided)
          let fileId = null;
          if (file) {
            const uploadResult = await hederaService.uploadFile(file, `proof-${proofType}-${Date.now()}`);
            fileId = uploadResult.fileId;
          }

          // Submit to HCS topic
          const consensusResult = await hederaService.submitMessage({
            type: 'PROOF_ADDED',
            lotId: newLotId,
            projectId: newProjectId,
            proofType,
            title,
            description,
            fileId,
            timestamp: new Date().toISOString(),
            submittedBy: userId
          });

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

        } catch (hederaError) {
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
  } catch (error) {
    console.error('Proof feed API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}