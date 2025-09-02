import { VercelRequest, VercelResponse } from '@vercel/node';
import { HederaMirrorNodeService } from '../shared/hedera-mirror.js';
import { MOCK_IDS } from '../shared/schema.js';
import { db, QueryHelpers } from '../shared/database.js';

// Known topic IDs for proof feeds (in production, these would come from database)
const PROOF_TOPIC_IDS = [
  MOCK_IDS.HCS_TOPICS.PROJECT_PROOFS,
  MOCK_IDS.HCS_TOPICS.VERIFICATION,
  '0.0.900123', // Additional demo topics
  '0.0.900124',
  '0.0.900125',
  '0.0.900126',
  '0.0.900127',
  '0.0.900128',
  '0.0.900129',
  '0.0.900130'
];

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

// Fallback to seed data when Mirror Node is unavailable
async function getFallbackProofs(limit: number = 50) {
  const proofs = await QueryHelpers.getProofs();
  return proofs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
    .map(proof => ({
      ...proof,
      source: 'Seed Data (Fallback)',
      operator: 'System'
    }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const userId = req.headers['x-user-id'] as string || 'demo-user';

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (method) {
      case 'GET':
        const { 
          limit = '50', 
          source = 'live', 
          topicId,
          sequenceNumber 
        } = query;

        // Handle specific message request
        if (topicId && sequenceNumber) {
          try {
            const messageResult = await HederaMirrorNodeService.getTopicMessage(
              topicId as string, 
              parseInt(sequenceNumber as string)
            );

            if (messageResult.success && messageResult.message) {
              const parseResult = HederaMirrorNodeService.parseProofMessage(messageResult.message.message);
              
              if (parseResult.success) {
                const proof = {
                  id: `${topicId}-${sequenceNumber}`,
                  ...parseResult.proof,
                  topicId: messageResult.message.topicId,
                  sequenceNumber: messageResult.message.sequenceNumber,
                  timestamp: messageResult.message.consensusTimestamp,
                  consensusTimestamp: messageResult.message.consensusTimestamp,
                  runningHash: messageResult.message.runningHash,
                  payerAccountId: messageResult.message.payerAccountId,
                  source: 'Mirror Node',
                  operator: messageResult.message.payerAccountId
                };

                // Generate HashScan links
                const hashScanLinks = HederaMirrorNodeService.generateHashScanLinks({
                  topicId: proof.topicId,
                  sequenceNumber: proof.sequenceNumber,
                  fileId: proof.fileId
                });

                await logAnalytics('mirror_message_viewed', {
                  userId,
                  topicId,
                  sequenceNumber,
                  source: 'live'
                });

                return res.status(200).json({
                  success: true,
                  data: proof,
                  proofLinks: hashScanLinks,
                  meta: {
                    source: 'Hedera Mirror Node',
                    timestamp: new Date().toISOString()
                  }
                });
              }
            }

            throw new Error('Message not found or invalid format');
          } catch (error) {
            console.error('Failed to fetch specific message:', error);
            return res.status(404).json({
              success: false,
              error: 'Message not found',
              details: error.message
            });
          }
        }

        // Handle live proof feed request
        if (source === 'live') {
          try {
            // Simulate network delay for realistic UX
            await new Promise(resolve => setTimeout(resolve, 800));

            const feedResult = await HederaMirrorNodeService.getLiveProofFeed(
              PROOF_TOPIC_IDS,
              parseInt(limit as string)
            );

            if (feedResult.success && feedResult.proofs.length > 0) {
              // Log analytics
              await logAnalytics('mirror_feed_viewed', {
                userId,
                source: 'live',
                resultCount: feedResult.proofs.length,
                topicsQueried: PROOF_TOPIC_IDS.length
              });

              return res.status(200).json({
                success: true,
                data: feedResult.proofs,
                meta: {
                  ...feedResult.meta,
                  timestamp: new Date().toISOString(),
                  fallbackUsed: false
                }
              });
            }

            // If no live data, fall back to seed data
            console.warn('No live data available, using fallback');
            throw new Error('No live data available');
          } catch (error) {
            console.error('Mirror Node request failed:', error);
            
            // Fallback to seed data
            const fallbackProofs = await getFallbackProofs(parseInt(limit as string));
            
            await logAnalytics('mirror_feed_fallback', {
              userId,
              source: 'fallback',
              resultCount: fallbackProofs.length,
              error: error.message
            });

            return res.status(200).json({
              success: true,
              data: fallbackProofs,
              meta: {
                total: fallbackProofs.length,
                source: 'Seed Data (Mirror Node Unavailable)',
                timestamp: new Date().toISOString(),
                fallbackUsed: true,
                fallbackReason: error.message
              },
              toast: {
                type: 'warning',
                title: 'Using Demo Data',
                message: 'Live Mirror Node data unavailable, showing demo proofs'
              }
            });
          }
        }

        // Handle seed data request (for testing/demo)
        if (source === 'seed') {
          const seedData = await getFallbackProofs(parseInt(limit as string));
          
          await logAnalytics('seed_feed_viewed', {
            userId,
            source: 'seed',
            resultCount: seedData.length
          });

          return res.status(200).json({
            success: true,
            data: seedData,
            meta: {
              total: seedData.length,
              source: 'Seed Data (Demo Mode)',
              timestamp: new Date().toISOString(),
              fallbackUsed: false
            }
          });
        }

        return res.status(400).json({
          success: false,
          error: 'Invalid source parameter. Use "live" or "seed"'
        });

      case 'POST':
        // Refresh Mirror Node cache or trigger re-sync
        try {
          // In a real implementation, this might clear caches or trigger background sync
          await logAudit('REFRESH', 'mirror_feed', 'cache', userId, {
            action: 'manual_refresh',
            timestamp: new Date().toISOString()
          });

          return res.status(200).json({
            success: true,
            message: 'Mirror Node feed refresh triggered',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to refresh mirror feed:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to refresh mirror feed',
            details: error.message
          });
        }

      default:
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Mirror feed API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}