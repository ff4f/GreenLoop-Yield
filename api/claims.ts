import { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import { db, QueryHelpers } from '../shared/database.js';
// @ts-ignore
import { HederaMockService } from '../shared/hedera-mock.js';
// @ts-ignore
import { HederaRealService } from '../shared/hedera-real.js';
// @ts-ignore
import { ClaimStatus, UserRole, buildProofLink } from '../shared/schema.js';

// Use real or mock service based on environment
const HederaService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

async function logAnalytics(event: string, metadata: any) {
  await QueryHelpers.createAnalytics({
    event,
    value: 1,
    metadata,
    userId: metadata.userId || 'anonymous'
  });
}

async function logAudit(action: string, entityType: string, entityId: string, userId: string, changes: any) {
  await QueryHelpers.createAuditLog({
    action,
    entityType,
    entityId,
    userId,
    changes
  });
}

// Claims Helper 8-Step Process Functions
async function validateClaim(claimData: any, hederaService: any) {
  // Step 1: Validate claim data and requirements
  const validationResults = {
    orderId: !!claimData.orderId,
    deliveryConfirmed: !!claimData.deliveryConfirmed,
    proofDocuments: claimData.proofDocuments && claimData.proofDocuments.length > 0,
    carbonCredits: claimData.carbonCredits > 0,
    validationScore: 0
  };

  validationResults.validationScore = Object.values(validationResults)
    .filter(v => typeof v === 'boolean')
    .reduce((score, valid) => score + (valid ? 25 : 0), 0);

  // Submit validation to HCS
  const validationTx = await hederaService.submitMessage({
    type: 'CLAIM_VALIDATION',
    claimId: claimData.id,
    validationResults,
    timestamp: new Date().toISOString()
  });

  return {
    valid: validationResults.validationScore === 100,
    validationResults,
    topicId: validationTx.topicId,
    sequenceNumber: validationTx.sequenceNumber
  };
}

async function generatePDF(claimData: any, hederaService: any) {
  // Step 2: Generate PDF certificate
  const pdfContent = {
    title: 'Carbon Credit Retirement Certificate',
    claimId: claimData.id,
    orderId: claimData.orderId,
    carbonCredits: claimData.carbonCredits,
    retiredBy: claimData.retiredBy,
    retiredFor: claimData.retiredFor,
    timestamp: new Date().toISOString(),
    certificateNumber: `CC-${claimData.id}-${Date.now()}`
  };

  // Upload PDF to HFS
  const pdfUpload = await hederaService.uploadFile(
    JSON.stringify(pdfContent), 
    `claim-certificate-${claimData.id}.pdf`
  );

  return {
    fileId: pdfUpload.fileId,
    certificateNumber: pdfContent.certificateNumber,
    downloadUrl: buildProofLink('file', pdfUpload.fileId)
  };
}

async function generateJSON(claimData: any, hederaService: any) {
  // Step 3: Generate JSON metadata
  const jsonMetadata = {
    '@context': 'https://schema.org/ClimateAction',
    '@type': 'CarbonCreditRetirement',
    identifier: claimData.id,
    orderId: claimData.orderId,
    carbonCredits: claimData.carbonCredits,
    retiredBy: claimData.retiredBy,
    retiredFor: claimData.retiredFor,
    retirementDate: new Date().toISOString(),
    standard: 'ICVCM',
    methodology: 'VM0042',
    vintage: '2024',
    serialNumbers: claimData.serialNumbers || [],
    proofDocuments: claimData.proofDocuments || []
  };

  // Upload JSON to HFS
  const jsonUpload = await hederaService.uploadFile(
    JSON.stringify(jsonMetadata, null, 2),
    `claim-metadata-${claimData.id}.json`
  );

  return {
    fileId: jsonUpload.fileId,
    metadata: jsonMetadata,
    downloadUrl: buildProofLink('file', jsonUpload.fileId)
  };
}

async function anchorToHedera(claimData: any, pdfFileId: string, jsonFileId: string, hederaService: any) {
  // Step 4: Anchor claim to Hedera network
  const anchorData = {
    type: 'CLAIM_ANCHORED',
    claimId: claimData.id,
    orderId: claimData.orderId,
    carbonCredits: claimData.carbonCredits,
    pdfFileId,
    jsonFileId,
    retiredBy: claimData.retiredBy,
    retiredFor: claimData.retiredFor,
    timestamp: new Date().toISOString(),
    hash: `sha256:${Math.random().toString(36).substr(2, 64)}`
  };

  // Submit to HCS
  const anchorTx = await hederaService.submitMessage(anchorData);

  // Create transaction record
  const transactionTx = await hederaService.createTransaction({
    type: 'CLAIM_RETIREMENT',
    amount: claimData.carbonCredits,
    memo: `Retirement of ${claimData.carbonCredits} carbon credits for ${claimData.retiredFor}`
  });

  return {
    topicId: anchorTx.topicId,
    sequenceNumber: anchorTx.sequenceNumber,
    transactionId: transactionTx.transactionId,
    hash: anchorData.hash,
    anchorUrl: buildProofLink('topic', `${anchorTx.topicId}#${anchorTx.sequenceNumber}`),
    transactionUrl: buildProofLink('transaction', transactionTx.transactionId)
  };
}

async function generateBadge(claimData: any, hederaService: any) {
  // Step 5: Generate NFT badge
  const badgeMetadata = {
    name: `Carbon Credit Retirement Badge #${claimData.id}`,
    description: `This badge certifies the retirement of ${claimData.carbonCredits} carbon credits`,
    image: `https://greenloop.example.com/badges/${claimData.id}.svg`,
    attributes: [
      { trait_type: 'Carbon Credits', value: claimData.carbonCredits },
      { trait_type: 'Retired By', value: claimData.retiredBy },
      { trait_type: 'Retired For', value: claimData.retiredFor },
      { trait_type: 'Retirement Date', value: new Date().toISOString().split('T')[0] },
      { trait_type: 'Standard', value: 'ICVCM' }
    ]
  };

  // Create NFT token
  const nftToken = await hederaService.createToken({
    name: badgeMetadata.name,
    symbol: 'GLBADGE',
    type: 'NON_FUNGIBLE',
    metadata: JSON.stringify(badgeMetadata)
  });

  return {
    tokenId: nftToken.tokenId,
    badgeMetadata,
    badgeUrl: buildProofLink('token', nftToken.tokenId)
  };
}

async function completeClaim(claimData: any, stepResults: any, hederaService: any) {
  // Step 6: Complete claim and update status
  const completionData = {
    type: 'CLAIM_COMPLETED',
    claimId: claimData.id,
    orderId: claimData.orderId,
    carbonCredits: claimData.carbonCredits,
    completedAt: new Date().toISOString(),
    artifacts: {
      pdfFileId: stepResults.pdf.fileId,
      jsonFileId: stepResults.json.fileId,
      badgeTokenId: stepResults.badge.tokenId,
      anchorTopicId: stepResults.anchor.topicId,
      transactionId: stepResults.anchor.transactionId
    }
  };

  // Submit completion to HCS
  const completionTx = await hederaService.submitMessage(completionData);

  return {
    topicId: completionTx.topicId,
    sequenceNumber: completionTx.sequenceNumber,
    completedAt: completionData.completedAt,
    completionUrl: buildProofLink('topic', `${completionTx.topicId}#${completionTx.sequenceNumber}`)
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query, body } = req;
  const userId = req.headers['x-user-id'] as string || 'demo-user';
  const userRole = req.headers['x-user-role'] as UserRole || UserRole.BUYER;

  try {
    switch (method) {
      case 'GET':
        // Get claims with optional filtering
        const { orderId, status, userId: filterUserId, limit = '50' } = query;
        
        const filteredClaims = await QueryHelpers.getClaims({
          orderId: orderId as string,
          status: status as ClaimStatus,
          userId: filterUserId as string,
          limit: parseInt(limit as string)
        });

        // Log analytics
        await logAnalytics('claims_viewed', {
          userId,
          filters: { orderId, status, userId: filterUserId },
          resultCount: filteredClaims.length
        });

        return res.status(200).json({
          success: true,
          data: filteredClaims,
          meta: {
            total: filteredClaims.length,
            filters: { orderId, status, userId: filterUserId }
          }
        });

      case 'POST':
        // Create new claim or execute step
        const { action, claimId, ...claimData } = body;

        if (action === 'create') {
          // Create new claim
          const { orderId, carbonCredits, retiredBy, retiredFor, proofDocuments } = claimData;

          // Validation
          if (!orderId || !carbonCredits || !retiredBy || !retiredFor) {
            return res.status(400).json({
              success: false,
              error: 'Missing required fields: orderId, carbonCredits, retiredBy, retiredFor'
            });
          }

          // Role-based access control
          if (userRole !== UserRole.BUYER && userRole !== UserRole.ADMIN) {
            return res.status(403).json({
              success: false,
              error: 'Insufficient permissions. Only Buyers and Admins can create claims.'
            });
          }

          const newClaim = {
            id: generateId(),
            orderId,
            carbonCredits,
            retiredBy,
            retiredFor,
            proofDocuments: proofDocuments || [],
            status: ClaimStatus.DRAFT,
            currentStep: 1,
            stepResults: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const createdClaim = await QueryHelpers.createClaim(newClaim);

          // Log analytics and audit
          await logAnalytics('claim_created', {
            userId,
            claimId: createdClaim.id,
            orderId,
            carbonCredits
          });

          await logAudit('CREATE', 'claim', createdClaim.id, userId, {
            orderId,
            carbonCredits,
            retiredBy,
            retiredFor
          });

          return res.status(201).json({
            success: true,
            data: createdClaim,
            toast: {
              type: 'success',
              title: 'Claim Created',
              message: `Claim for ${carbonCredits} carbon credits has been created`
            }
          });
        }

        // Execute claim step
        if (!claimId) {
          return res.status(400).json({
            success: false,
            error: 'Claim ID is required for step execution'
          });
        }

        const claim = await QueryHelpers.getClaimById(claimId);
        if (!claim) {
          return res.status(404).json({
            success: false,
            error: 'Claim not found'
          });
        }
        
        // Role-based access control
        if (claim.retiredBy !== userId && userRole !== UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions. You can only process your own claims.'
          });
        }

        try {
          const hederaService = HederaService;
          let stepResult;
          let nextStep = claim.currentStep;
          let newStatus = claim.status;

          switch (action) {
            case 'validate':
              if (claim.currentStep !== 1) {
                return res.status(400).json({ success: false, error: 'Validation can only be performed at step 1' });
              }
              stepResult = await validateClaim(claim, hederaService);
              nextStep = stepResult.valid ? 2 : 1;
              newStatus = stepResult.valid ? ClaimStatus.VALIDATING : ClaimStatus.DRAFT;
              break;

            case 'generate_pdf':
              if (claim.currentStep !== 2) {
                return res.status(400).json({ success: false, error: 'PDF generation can only be performed at step 2' });
              }
              stepResult = await generatePDF(claim, hederaService);
              nextStep = 3;
              break;

            case 'generate_json':
              if (claim.currentStep !== 3) {
                return res.status(400).json({ success: false, error: 'JSON generation can only be performed at step 3' });
              }
              stepResult = await generateJSON(claim, hederaService);
              nextStep = 4;
              break;

            case 'anchor':
              if (claim.currentStep !== 4) {
                return res.status(400).json({ success: false, error: 'Anchoring can only be performed at step 4' });
              }
              const pdfFileId = claim.stepResults.pdf?.fileId;
              const jsonFileId = claim.stepResults.json?.fileId;
              if (!pdfFileId || !jsonFileId) {
                return res.status(400).json({ success: false, error: 'PDF and JSON must be generated before anchoring' });
              }
              stepResult = await anchorToHedera(claim, pdfFileId, jsonFileId, hederaService);
              nextStep = 5;
              newStatus = ClaimStatus.PROCESSING;
              break;

            case 'generate_badge':
              if (claim.currentStep !== 5) {
                return res.status(400).json({ success: false, error: 'Badge generation can only be performed at step 5' });
              }
              stepResult = await generateBadge(claim, hederaService);
              nextStep = 6;
              break;

            case 'complete':
              if (claim.currentStep !== 6) {
                return res.status(400).json({ success: false, error: 'Completion can only be performed at step 6' });
              }
              stepResult = await completeClaim(claim, claim.stepResults, hederaService);
              nextStep = 7;
              newStatus = ClaimStatus.COMPLETED;
              break;

            default:
              return res.status(400).json({
                success: false,
                error: `Invalid action: ${action}. Valid actions: create, validate, generate_pdf, generate_json, anchor, generate_badge, complete`
              });
          }

          // Update claim
          const updatedClaim = await QueryHelpers.updateClaim(claimId, {
            stepResults: { ...claim.stepResults, [action]: stepResult },
            currentStep: nextStep,
            status: newStatus,
            updatedAt: new Date().toISOString()
          });

          // Log analytics and audit
          await logAnalytics('claim_step_executed', {
            userId,
            claimId,
            action,
            step: claim.currentStep,
            success: true
          });

          await logAudit('UPDATE', 'claim', claimId, userId, {
            action,
            step: { from: claim.currentStep, to: nextStep },
            status: { from: claim.status, to: newStatus },
            stepResult
          });

          return res.status(200).json({
            success: true,
            data: updatedClaim,
            stepResult,
            toast: {
              type: 'success',
              title: `Step ${claim.currentStep} Completed`,
              message: `${action.replace('_', ' ')} completed successfully`,
              links: (stepResult as any).downloadUrl || (stepResult as any).badgeUrl || (stepResult as any).anchorUrl ? {
                primary: (stepResult as any).downloadUrl || (stepResult as any).badgeUrl || (stepResult as any).anchorUrl
              } : undefined
            }
          });

        } catch (stepError: any) {
          console.error(`Claim step ${action} failed:`, stepError);
          
          // Log failed step
          await logAnalytics('claim_step_failed', {
            userId,
            claimId,
            action,
            step: claim.currentStep,
            error: stepError.message
          });

          return res.status(500).json({
            success: false,
            error: `Failed to execute step: ${action}`,
            details: stepError.message
          });
        }

      case 'DELETE':
        // Delete claim (admin only, draft status only)
        const deleteClaimId = query.id as string;

        if (!deleteClaimId) {
          return res.status(400).json({
            success: false,
            error: 'Claim ID is required'
          });
        }

        // Role-based access control
        if (userRole !== UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions. Only Admins can delete claims.'
          });
        }

        const claimToDelete = await QueryHelpers.getClaimById(deleteClaimId);
        if (!claimToDelete) {
          return res.status(404).json({
            success: false,
            error: 'Claim not found'
          });
        }
        
        // Only allow deletion of draft claims
        if (claimToDelete.status !== ClaimStatus.DRAFT) {
          return res.status(400).json({
            success: false,
            error: 'Only draft claims can be deleted'
          });
        }

        await QueryHelpers.deleteClaim(deleteClaimId);

        // Log analytics and audit
        await logAnalytics('claim_deleted', {
          userId,
          claimId: deleteClaimId,
          orderId: claimToDelete.orderId
        });

        await logAudit('DELETE', 'claim', deleteClaimId, userId, {
          deletedClaim: {
            orderId: claimToDelete.orderId,
            carbonCredits: claimToDelete.carbonCredits,
            retiredBy: claimToDelete.retiredBy,
            retiredFor: claimToDelete.retiredFor
          }
        });

        return res.status(200).json({
          success: true,
          message: 'Claim deleted successfully',
          toast: {
            type: 'success',
            title: 'Claim Deleted',
            message: `Claim for ${claimToDelete.carbonCredits} carbon credits has been deleted`
          }
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`
        });
    }
  } catch (error: any) {
    console.error('Claims API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}