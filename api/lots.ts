import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
// @ts-ignore
import { LotStatus, MOCK_IDS, ProofLink, calculateOrderFees, canTransitionLotStatus } from '../shared/schema.js';
// @ts-ignore
import { calcPDI } from '../shared/schema.js';
// @ts-ignore
import { db, QueryHelpers } from '../shared/database.js';
// @ts-ignore
import { SEED_LOTS } from '../shared/seed-data.js';
// @ts-ignore
import { HederaMockService } from '../shared/hedera-mock.js';
// @ts-ignore
import { HederaRealService } from '../shared/hedera-real.js';
// @ts-ignore
import { requireAuth, requirePermission, requireRole } from '../middleware/auth-guard.js';
// @ts-ignore
import { PERMISSIONS, USER_ROLES } from '../shared/guards.js';

// Use real or mock service based on environment
const HederaService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;

// Helper function to generate unique IDs
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to log analytics
// @ts-ignore
const logAnalytics = async (metric: string, value: number, metadata: any = {}) => {
  if (db) {
    await QueryHelpers.createAnalytics({
      event: metric,
      value,
      metadata,
      userId: metadata.userId || 'system'
    });
  }
};

// Helper function to log audit trail
// @ts-ignore
const logAudit = async (userId: string, action: string, entityType: string, entityId: string, changes: any) => {
  await QueryHelpers.createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    changes
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const lotId = query.id as string;
  const action = query.action as string;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication check for all methods except GET (public marketplace)
  if (method !== 'GET') {
    const authResult = await requireAuth(req);
    if (authResult.error) {
      return res.status(401).json({ error: authResult.error });
    }
  }

  try {
    switch (method) {
      case 'GET':
        if (lotId) {
          // Get single lot
          const lot = await QueryHelpers.getCarbonLotById(lotId);
          if (!lot) {
            return res.status(404).json({ error: 'Lot not found' });
          }
          
          // Log view analytics
          await logAnalytics('lot_view', 1, { lotId, type: lot.type });
          
          return res.status(200).json({
            success: true,
            data: lot,
            proofLinks: {
              marketplace: `/app#marketplace`,
              project: `/app#project-sheets`
            }
          });
        } else {
          // Get all lots with optional filtering
          const status = query.status as string;
          const type = query.type as string;
          const developerId = query.developerId as string;
          const minPdi = query.minPdi ? parseInt(query.minPdi as string) : undefined;
          
          let filteredLots;
          
          // Try database first, fallback to mock data if database unavailable
          try {
            filteredLots = await QueryHelpers.getCarbonLots({ 
              status: status as LotStatus, 
              type, 
              developerId,
              minPdi
            });
          } catch (dbError: any) {
             console.log('Database unavailable, using mock data:', dbError.message);
             
             // Use mock data and apply filters
             filteredLots = SEED_LOTS.map((lot: any) => {
               // Calculate PDI for each lot using proofs
               const pdi = calcPDI(lot.proofs || []);
               return { ...lot, pdi };
             });
             
             // Apply filters
             if (status) {
               filteredLots = filteredLots.filter((lot: any) => lot.status === status);
             }
             if (type) {
               filteredLots = filteredLots.filter((lot: any) => lot.type === type);
             }
             if (developerId) {
               filteredLots = filteredLots.filter((lot: any) => lot.developerId === developerId);
             }
             if (minPdi !== undefined) {
               filteredLots = filteredLots.filter((lot: any) => lot.pdi >= minPdi);
             }
           }
          
          // Log marketplace view analytics
          await logAnalytics('marketplace_view', 1, { 
            totalLots: filteredLots.length,
            filters: { status, type, developerId }
          });
          
          return res.status(200).json({
            success: true,
            data: filteredLots,
            meta: {
              total: filteredLots.length,
              draft: filteredLots.filter((l: any) => l.status === LotStatus.DRAFT).length,
            pending_verification: filteredLots.filter((l: any) => l.status === LotStatus.PENDING_VERIFICATION).length,
            verified: filteredLots.filter((l: any) => l.status === LotStatus.VERIFIED).length,
            listed: filteredLots.filter((l: any) => l.status === LotStatus.LISTED).length,
            partially_sold: filteredLots.filter((l: any) => l.status === LotStatus.PARTIALLY_SOLD).length,
            sold_out: filteredLots.filter((l: any) => l.status === LotStatus.SOLD_OUT).length,
            retired: filteredLots.filter((l: any) => l.status === LotStatus.RETIRED).length
            },
            proofLinks: {
              addProof: `/app#proof-feed`,
              viewOrders: `/app#orders`
            }
          });
        }

      case 'POST':
        if (action === 'generate') {
          // Check permission for lot generation
          const permissionResult = await requirePermission(req, PERMISSIONS.CREATE_LOT);
          if (permissionResult.error) {
            return res.status(403).json({ error: permissionResult.error });
          }
          
          // Generate Lot action from Project Sheets
          const { projectData, userId } = req.body;
          
          if (!projectData || !userId) {
            return res.status(400).json({ 
              error: 'Missing required fields: projectData, userId' 
            });
          }
          
          // Validate project data
          const requiredFields = ['projectName', 'location', 'type', 'rate', 'bufferPercent', 'forwardPercent', 'pricePerTon'];
          for (const field of requiredFields) {
            if (!projectData[field]) {
              return res.status(400).json({ 
                error: `Missing required field: ${field}`,
                toast: {
                  type: 'error',
                  message: `Please fill in the ${field} field before generating a lot.`
                }
              });
            }
          }
          
          // Check area or units requirement
          if (!projectData.area && !projectData.units) {
            return res.status(400).json({ 
              error: 'Either area or units must be provided',
              toast: {
                type: 'error',
                message: 'Please specify either project area (hectares) or units before generating a lot.'
              }
            });
          }
          
          // Calculate total tons
          const totalTons = projectData.area 
            ? projectData.area * projectData.rate
            : projectData.units * projectData.rate;
          
          // Simulate Hedera operations
          await HederaService.simulateNetworkDelay(1500);
          
          // Create fungible token for carbon credits
          const token = await HederaService.token.createFungibleToken(
            `${projectData.projectName} Carbon Credits`,
            'CCT',
            totalTons
          );
          
          // Upload project files to HFS
          const projectFile = await HederaService.file.uploadFile(
            JSON.stringify(projectData),
            'application/json'
          );
          
          // Log to HCS
          const hcsLog = await HederaService.consensus.submitMessage(
            MOCK_IDS.HCS_TOPICS.PROOF,
            JSON.stringify({
              action: 'lot_generated',
              projectName: projectData.projectName,
              totalTons,
              tokenId: token.tokenId,
              timestamp: new Date().toISOString()
            })
          );
          
          // Create new lot
          const newLotData = {
            id: generateId('lot'),
            projectId: generateId('proj'),
            projectName: projectData.projectName,
            location: projectData.location,
            type: projectData.type,
            area: projectData.area,
            units: projectData.units,
            rate: projectData.rate,
            bufferPercent: projectData.bufferPercent,
            forwardPercent: projectData.forwardPercent,
            pricePerTon: projectData.pricePerTon,
            totalTons,
            availableTons: totalTons,
            status: LotStatus.DRAFT,
            developerId: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const newLot = await QueryHelpers.createCarbonLot(newLotData);
          
          // Log analytics and audit
          await logAnalytics('lot_generated', 1, { 
            type: projectData.type, 
            totalTons,
            pricePerTon: projectData.pricePerTon
          });
          
          await logAudit(userId, 'generate_lot', 'lot', newLot.id, {
            projectName: projectData.projectName,
            totalTons,
            tokenId: token.tokenId,
            fileId: projectFile.fileId
          });
          
          return res.status(201).json({
            success: true,
            data: newLot,
            proofOutputs: {
              tokenId: token.tokenId,
              minted: `${totalTons} CCT tokens minted`,
              fileIds: [projectFile.fileId],
              hcsLogs: [`${hcsLog.topicId}#${hcsLog.sequenceNumber}`]
            },
            proofLinks: {
              token: ProofLink.buildTokenLink(token.tokenId),
              file: ProofLink.buildFileLink(projectFile.fileId),
              topic: ProofLink.buildTopicLink(hcsLog.topicId, hcsLog.sequenceNumber)
            },
            toast: {
              type: 'success',
              message: `Lot generated successfully! Token ID: ${token.tokenId}`,
              links: [
                {
                  text: 'View Token',
                  url: ProofLink.buildTokenLink(token.tokenId)
                },
                {
                  text: 'View on Marketplace',
                  url: '/app#marketplace'
                }
              ]
            }
          });
        } else {
          // Check permission for lot creation
          const permissionResult = await requirePermission(req, PERMISSIONS.CREATE_LOT);
          if (permissionResult.error) {
            return res.status(403).json({ error: permissionResult.error });
          }
          
          // Create new lot (standard CRUD)
          const lotData = req.body;
          const newLotData = {
            id: generateId('lot'),
            ...lotData,
            status: LotStatus.DRAFT,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const newLot = await QueryHelpers.createCarbonLot(newLotData);
          
          return res.status(201).json({
            success: true,
            data: newLot
          });
        }

      case 'PUT':
        // Check permission for lot updates
        const updatePermissionResult = await requirePermission(req, PERMISSIONS.UPDATE_LOT);
        if (updatePermissionResult.error) {
          return res.status(403).json({ error: updatePermissionResult.error });
        }
        
        if (!lotId) {
          return res.status(400).json({ error: 'Lot ID is required' });
        }
        
        const existingLot = await QueryHelpers.getCarbonLotById(lotId);
        if (!existingLot) {
          return res.status(404).json({ error: 'Lot not found' });
        }
        
        if (action === 'transition') {
          // Status transition with guards
          const { newStatus, userId, hasValidUploads = false, isRetired = false } = req.body;
          
          if (!newStatus || !userId) {
            return res.status(400).json({ 
              error: 'Missing required fields: newStatus, userId' 
            });
          }
          
          // Calculate PDI for validation
          const proofs = await QueryHelpers.getProofsByLotId(lotId) || [];
          const pdi = calcPDI(proofs);
          
          // Check if transition is allowed with PDI validation
          if (!canTransitionLotStatus(existingLot.status, newStatus, hasValidUploads, isRetired, pdi)) {
            let errorMessage = `Cannot transition lot from ${existingLot.status} to ${newStatus}. Please check the requirements.`;
            
            // Specific error messages for PDI validation
            if (existingLot.status === LotStatus.MINTED && newStatus === LotStatus.LISTED && pdi < 70) {
              errorMessage = `Cannot list lot with PDI ${pdi}%. Minimum PDI of 70% required. Please upload more proof documents.`;
            }
            
            return res.status(400).json({ 
              error: `Invalid status transition from ${existingLot.status} to ${newStatus}`,
              toast: {
                type: 'error',
                message: errorMessage
              }
            });
          }
          
          // Additional validation for DRAFT -> PROOFED
          if (existingLot.status === LotStatus.DRAFT && newStatus === LotStatus.PROOFED) {
            if (!hasValidUploads) {
              return res.status(400).json({ 
                error: 'Valid uploads required to proof lot',
                toast: {
                  type: 'error',
                  message: 'Please upload at least one proof document before marking as proofed.'
                }
              });
            }
          }
          
          // Update lot status
          const updatedLot = await QueryHelpers.updateCarbonLot(lotId, {
            status: newStatus,
            updatedAt: new Date().toISOString()
          });
          
          // Log analytics and audit
          await logAnalytics('lot_status_change', 1, { 
            from: existingLot.status, 
            to: newStatus,
            lotId 
          });
          
          await logAudit(userId, 'transition_lot_status', 'lot', lotId, {
            from: existingLot.status,
            to: newStatus
          });
          
          return res.status(200).json({
            success: true,
            data: updatedLot,
            toast: {
              type: 'success',
              message: `Lot status updated to ${newStatus}`,
              links: newStatus === LotStatus.LISTED ? [
                {
                  text: 'View on Marketplace',
                  url: '/app#marketplace'
                }
              ] : []
            }
          });
        } else {
          // Standard update
          const updateData = req.body;
          const updatedLot = await QueryHelpers.updateCarbonLot(lotId, {
            ...updateData,
            updatedAt: new Date().toISOString()
          });
          
          return res.status(200).json({
            success: true,
            data: updatedLot
          });
        }

      case 'DELETE':
        // Check permission for lot deletion
        const deletePermissionResult = await requirePermission(req, PERMISSIONS.DELETE_LOT);
        if (deletePermissionResult.error) {
          return res.status(403).json({ error: deletePermissionResult.error });
        }
        
        if (!lotId) {
          return res.status(400).json({ error: 'Lot ID is required' });
        }
        
        const lot = await QueryHelpers.getCarbonLotById(lotId);
        if (!lot) {
          return res.status(404).json({ error: 'Lot not found' });
        }
        
        // Check if lot can be deleted (only DRAFT status)
        if (lot.status !== LotStatus.DRAFT) {
          return res.status(400).json({ 
            error: 'Only draft lots can be deleted',
            toast: {
              type: 'error',
              message: 'Cannot delete lot that has been listed or has active orders.'
            }
          });
        }
        
        await QueryHelpers.deleteCarbonLot(lotId);
        
        return res.status(200).json({
          success: true,
          message: 'Lot deleted successfully'
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Lots API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      toast: {
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      }
    });
  }
}