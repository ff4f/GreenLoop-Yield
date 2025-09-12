import { VercelRequest, VercelResponse } from '@vercel/node';

// @ts-ignore
import { MOCK_IDS, ProofLink } from '../shared/schema.js';
// @ts-ignore
import { HederaMockService } from '../shared/hedera-mock.js';
// @ts-ignore
import { HederaRealService } from '../shared/hedera-real.js';

// Use real or mock service based on environment
const HederaService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;

// Helper functions
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const action = query.action as string;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (method) {
      case 'POST':
        if (action === 'create-topic') {
          // Create HCS Topic
          const { userId, topicMemo, submitKey } = req.body;
          
          if (!userId || !topicMemo) {
            return res.status(400).json({ 
              error: 'Missing required fields: userId, topicMemo' 
            });
          }
          
          // Simulate Hedera operations
          await HederaService.simulateNetworkDelay(2000);
      
      // Create topic
      const topic = await HederaService.consensus.createTopic(
            topicMemo,
            submitKey || null
          );
          
          // Log analytics and audit
          logAnalytics('topic_created', 1, { 
            topicId: topic.topicId,
            memo: topicMemo,
            userId 
          });
          
          logAudit(userId, 'create_topic', 'topic', topic.topicId, {
            memo: topicMemo,
            submitKey: !!submitKey
          });
          
          return res.status(201).json({
            success: true,
            data: {
              topicId: topic.topicId,
              memo: topicMemo,
              submitKey,
              createdAt: new Date().toISOString()
            },
            proofOutputs: {
              topicId: topic.topicId,
              transactionId: topic.transactionId,
              status: 'Topic created successfully'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(topic.transactionId),
              topic: ProofLink.buildTopicLink(topic.topicId)
            },
            toast: {
              type: 'success',
              message: `Topic created successfully! ID: ${topic.topicId}`,
              links: [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(topic.transactionId)
                },
                {
                  text: 'View Topic',
                  url: ProofLink.buildTopicLink(topic.topicId)
                }
              ]
            }
          });
        } else if (action === 'submit-message') {
          // Submit Message to HCS Topic
          const { userId, topicId, message } = req.body;
          
          if (!userId || !topicId || !message) {
            return res.status(400).json({ 
              error: 'Missing required fields: userId, topicId, message' 
            });
          }
          
          // Simulate Hedera operations
          await HederaService.simulateNetworkDelay(1500);
      
      // Submit message
      const submission = await HederaService.consensus.submitMessage(
            topicId,
            JSON.stringify(message)
          );
          
          // Log analytics and audit
          logAnalytics('message_submitted', 1, { 
            topicId,
            messageSize: JSON.stringify(message).length,
            userId 
          });
          
          logAudit(userId, 'submit_message', 'topic', topicId, {
            transactionId: submission.transactionId,
            messageSize: JSON.stringify(message).length
          });
          
          return res.status(201).json({
            success: true,
            data: {
              topicId,
              transactionId: submission.transactionId,
              sequenceNumber: submission.sequenceNumber,
              submittedAt: new Date().toISOString()
            },
            proofOutputs: {
              transactionId: submission.transactionId,
              sequenceNumber: submission.sequenceNumber,
              status: 'Message submitted successfully'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(submission.transactionId),
              topic: ProofLink.buildTopicLink(topicId)
            },
            toast: {
              type: 'success',
              message: `Message submitted to topic ${topicId}!`,
              links: [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(submission.transactionId)
                }
              ]
            }
          });
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'GET':
        if (action === 'get-messages') {
          // Get Messages from HCS Topic
          const topicId = query.topicId as string;
          const limit = parseInt(query.limit as string) || 10;
          
          if (!topicId) {
            return res.status(400).json({ 
              error: 'Missing required parameter: topicId' 
            });
          }
          
          // Simulate Hedera operations
          await HederaService.simulateNetworkDelay(1000);
      
      // Get messages
      const messages = await HederaService.consensus.getMessages(
            topicId,
            limit
          );
          
          // Log analytics
          logAnalytics('messages_retrieved', messages.length, { 
            topicId,
            limit 
          });
          
          return res.status(200).json({
            success: true,
            data: messages,
            meta: {
              topicId,
              count: messages.length,
              limit
            },
            proofLinks: {
              topic: ProofLink.buildTopicLink(topicId)
            }
          });
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Hedera Consensus API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      toast: {
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      }
    });
  }
}