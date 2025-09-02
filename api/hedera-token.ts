import { VercelRequest, VercelResponse } from '@vercel/node';

import { ProofLink } from '../shared/schema.js';
import { HederaMockService } from '../shared/hedera-mock.js';

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
        if (action === 'create-token') {
          // Create HTS Token
          const { userId, tokenName, tokenSymbol, decimals, initialSupply, treasuryAccountId } = req.body;
          
          if (!userId || !tokenName || !tokenSymbol || !treasuryAccountId) {
            return res.status(400).json({ 
              error: 'Missing required fields: userId, tokenName, tokenSymbol, treasuryAccountId' 
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(3000);
          
          // Create token
          const token = await HederaMockService.token.createToken(
            tokenName,
            tokenSymbol,
            decimals || 0,
            initialSupply || 0,
            treasuryAccountId
          );
          
          // Log analytics and audit
          logAnalytics('token_created', 1, { 
            tokenId: token.tokenId,
            name: tokenName,
            symbol: tokenSymbol,
            userId 
          });
          
          logAudit(userId, 'create_token', 'token', token.tokenId, {
            name: tokenName,
            symbol: tokenSymbol,
            decimals,
            initialSupply,
            treasuryAccountId
          });
          
          return res.status(201).json({
            success: true,
            data: {
              tokenId: token.tokenId,
              name: tokenName,
              symbol: tokenSymbol,
              decimals,
              initialSupply,
              treasuryAccountId,
              createdAt: new Date().toISOString()
            },
            proofOutputs: {
              tokenId: token.tokenId,
              transactionId: token.transactionId,
              status: 'Token created successfully'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(token.transactionId),
              token: ProofLink.buildTokenLink(token.tokenId)
            },
            toast: {
              type: 'success',
              message: `Token ${tokenSymbol} created successfully! ID: ${token.tokenId}`,
              links: [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(token.transactionId)
                },
                {
                  text: 'View Token',
                  url: ProofLink.buildTokenLink(token.tokenId)
                }
              ]
            }
          });
        } else if (action === 'mint-token') {
          // Mint HTS Token
          const { userId, tokenId, amount, recipientAccountId } = req.body;
          
          if (!userId || !tokenId || !amount) {
            return res.status(400).json({ 
              error: 'Missing required fields: userId, tokenId, amount' 
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(2000);
          
          // Mint token
          const mint = await HederaMockService.token.mintToken(
            tokenId,
            amount,
            recipientAccountId
          );
          
          // Log analytics and audit
          logAnalytics('token_minted', amount, { 
            tokenId,
            amount,
            recipientAccountId,
            userId 
          });
          
          logAudit(userId, 'mint_token', 'token', tokenId, {
            amount,
            recipientAccountId,
            transactionId: mint.transactionId
          });
          
          return res.status(201).json({
            success: true,
            data: {
              tokenId,
              amount,
              recipientAccountId,
              transactionId: mint.transactionId,
              newTotalSupply: mint.newTotalSupply,
              mintedAt: new Date().toISOString()
            },
            proofOutputs: {
              transactionId: mint.transactionId,
              amount: `${amount} tokens minted`,
              newTotalSupply: mint.newTotalSupply,
              status: 'Tokens minted successfully'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(mint.transactionId),
              token: ProofLink.buildTokenLink(tokenId)
            },
            toast: {
              type: 'success',
              message: `${amount} tokens minted successfully!`,
              links: [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(mint.transactionId)
                }
              ]
            }
          });
        } else if (action === 'transfer-token') {
          // Transfer HTS Token
          const { userId, tokenId, amount, fromAccountId, toAccountId } = req.body;
          
          if (!userId || !tokenId || !amount || !fromAccountId || !toAccountId) {
            return res.status(400).json({ 
              error: 'Missing required fields: userId, tokenId, amount, fromAccountId, toAccountId' 
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(1500);
          
          // Transfer token
          const transfer = await HederaMockService.token.transferToken(
            tokenId,
            amount,
            fromAccountId,
            toAccountId
          );
          
          // Log analytics and audit
          logAnalytics('token_transferred', amount, { 
            tokenId,
            amount,
            fromAccountId,
            toAccountId,
            userId 
          });
          
          logAudit(userId, 'transfer_token', 'token', tokenId, {
            amount,
            fromAccountId,
            toAccountId,
            transactionId: transfer.transactionId
          });
          
          return res.status(201).json({
            success: true,
            data: {
              tokenId,
              amount,
              fromAccountId,
              toAccountId,
              transactionId: transfer.transactionId,
              transferredAt: new Date().toISOString()
            },
            proofOutputs: {
              transactionId: transfer.transactionId,
              amount: `${amount} tokens transferred`,
              from: fromAccountId,
              to: toAccountId,
              status: 'Tokens transferred successfully'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(transfer.transactionId),
              token: ProofLink.buildTokenLink(tokenId)
            },
            toast: {
              type: 'success',
              message: `${amount} tokens transferred successfully!`,
              links: [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(transfer.transactionId)
                }
              ]
            }
          });
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'GET':
        if (action === 'get-balance') {
          // Get Token Balance
          const tokenId = query.tokenId as string;
          const accountId = query.accountId as string;
          
          if (!tokenId || !accountId) {
            return res.status(400).json({ 
              error: 'Missing required parameters: tokenId, accountId' 
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(1000);
          
          // Get balance
          const balance = await HederaMockService.token.getTokenBalance(
            tokenId,
            accountId
          );
          
          // Log analytics
          logAnalytics('balance_retrieved', 1, { 
            tokenId,
            accountId,
            balance 
          });
          
          return res.status(200).json({
            success: true,
            data: {
              tokenId,
              accountId,
              balance,
              retrievedAt: new Date().toISOString()
            },
            proofLinks: {
              token: ProofLink.buildTokenLink(tokenId)
            }
          });
        } else if (action === 'get-info') {
          // Get Token Info
          const tokenId = query.tokenId as string;
          
          if (!tokenId) {
            return res.status(400).json({ 
              error: 'Missing required parameter: tokenId' 
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(1000);
          
          // Get token info
          const tokenInfo = await HederaMockService.token.getTokenInfo(tokenId);
          
          // Log analytics
          logAnalytics('token_info_retrieved', 1, { tokenId });
          
          return res.status(200).json({
            success: true,
            data: tokenInfo,
            proofLinks: {
              token: ProofLink.buildTokenLink(tokenId)
            }
          });
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Hedera Token API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      toast: {
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      }
    });
  }
}