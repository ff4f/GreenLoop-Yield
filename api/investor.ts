import { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import { db, QueryHelpers } from '../shared/database.js';
// @ts-ignore
import { calculatePayoutSplit } from '../shared/schema.js';
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

async function logAnalytics(event: string, value: number, metadata: any) {
  await QueryHelpers.createAnalytics({
    event,
    value,
    metadata,
    userId: metadata.userId || 'system'
  });
}

async function logAudit(userId: string, action: string, resourceType: string, resourceId: string, metadata: any) {
  await QueryHelpers.createAuditLog({
    userId,
    action,
    entityType: resourceType,
    entityId: resourceId,
    changes: metadata
  });
}

// Calculate APR based on recent settlements
async function calculateAPR(days: number = 7): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Get recent settlement flows
  const settlementFlows = await db.query(`
    SELECT SUM(amount) as totalSettlements
    FROM investor_flows 
    WHERE type = 'CREDIT_FROM_SETTLEMENT' 
    AND created_at >= $1
  `, [cutoffDate.toISOString()]);
  
  // Get average pool TVL during period
  const avgTVL = await db.query(`
    SELECT AVG(tvl) as avgTvl
    FROM investor_pools
    WHERE updated_at >= $1
  `, [cutoffDate.toISOString()]);
  
  const totalSettlements = parseFloat(settlementFlows.rows[0]?.totalSettlements || '0');
  const avgPoolTVL = parseFloat(avgTVL.rows[0]?.avgTvl || '1');
  
  if (avgPoolTVL === 0) return 0;
  
  // Annualize the return
  const periodReturn = totalSettlements / avgPoolTVL;
  const annualizedReturn = (periodReturn * 365) / days;
  
  return Math.max(0, annualizedReturn * 100); // Return as percentage
}

// Update pool stats after settlement
async function updatePoolStats(settlementAmount: number) {
  const pool = await QueryHelpers.getInvestorPool();
  if (!pool) {
    throw new Error('Investor pool not found');
  }
  
  const newTVL = parseFloat(pool.tvl) + settlementAmount;
  const apr7d = await calculateAPR(7);
  const apr30d = await calculateAPR(30);
  
  await QueryHelpers.updateInvestorPool({
    tvl: newTVL.toString(),
    apr: apr7d.toString(),
    lastSettlementAt: new Date()
  });
  
  return { newTVL, apr7d, apr30d };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const action = query.action as string;
  const userId = req.headers['x-user-id'] as string;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-idempotency-key');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!userId) {
    return res.status(401).json({ error: 'User ID required in x-user-id header' });
  }

  try {
    switch (method) {
      case 'GET':
        if (action === 'stats') {
          // Get pool statistics
          const pool = await QueryHelpers.getInvestorPool();
          if (!pool) {
            return res.status(404).json({ error: 'Investor pool not found' });
          }
          
          const apr7d = await calculateAPR(7);
          const apr30d = await calculateAPR(30);
          
          return res.status(200).json({
            success: true,
            data: {
              tvl: parseFloat(pool.tvl),
              totalShares: parseFloat(pool.totalShares),
              sharePrice: parseFloat(pool.sharePrice),
              apr7d,
              apr30d,
              totalDeposits: parseFloat(pool.totalDeposits),
              totalWithdrawals: parseFloat(pool.totalWithdrawals),
              lastSettlementAt: pool.lastSettlementAt
            }
          });
        } else if (action === 'flows') {
          // Get user's investment flows
          const flows = await db.query(`
            SELECT * FROM investor_flows 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT 50
          `, [userId]);
          
          return res.status(200).json({
            success: true,
            data: flows.rows.map((flow: any) => ({
              ...flow,
              amount: parseFloat(flow.amount),
              sharesDelta: parseFloat(flow.shares_delta)
            }))
          });
        } else {
          // Get user's investor account
          const account = await QueryHelpers.getInvestorAccount(userId);
          if (!account) {
            return res.status(404).json({ error: 'Investor account not found' });
          }
          
          const pool = await QueryHelpers.getInvestorPool();
          const currentValue = parseFloat(account.shares) * parseFloat(pool?.sharePrice || '1');
          
          return res.status(200).json({
            success: true,
            data: {
              ...account,
              shares: parseFloat(account.shares),
              depositTotal: parseFloat(account.depositTotal),
              withdrawTotal: parseFloat(account.withdrawTotal),
              currentValue,
              unrealizedGain: currentValue - parseFloat(account.depositTotal) + parseFloat(account.withdrawTotal)
            }
          });
        }
        break;

      case 'POST':
        const { amount, type } = req.body;
        const idempotencyKey = req.headers['x-idempotency-key'] as string;
        
        if (!idempotencyKey) {
          return res.status(400).json({ error: 'Idempotency key required' });
        }
        
        // Check for duplicate request
        const existingFlow = await db.query(`
          SELECT * FROM investor_flows 
          WHERE metadata->>'idempotencyKey' = $1
        `, [idempotencyKey]);
        
        if (existingFlow.rows.length > 0) {
          return res.status(200).json({
            success: true,
            data: existingFlow.rows[0],
            message: 'Request already processed'
          });
        }
        
        if (action === 'deposit') {
          if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid deposit amount required' });
          }
          
          // Get or create investor account
          let account = await QueryHelpers.getInvestorAccount(userId);
          if (!account) {
            account = await QueryHelpers.createInvestorAccount({ userId });
          }
          
          // Get current pool state
          const pool = await QueryHelpers.getInvestorPool();
          const sharePrice = parseFloat(pool?.sharePrice || '1');
          const sharesIssued = amount / sharePrice;
          
          // Simulate Hedera transaction
          const txHash = await HederaService.transferTokens({
            from: userId,
            to: 'investor_pool',
            amount,
            tokenId: 'HBAR'
          });
          
          // Record deposit flow
          const flowId = generateId('flow');
          await db.query(`
            INSERT INTO investor_flows (id, user_id, type, amount, shares_delta, tx_hash, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          `, [
            flowId,
            userId,
            'DEPOSIT',
            amount.toString(),
            sharesIssued.toString(),
            txHash,
            JSON.stringify({ idempotencyKey, sharePrice })
          ]);
          
          // Update investor account
          await db.query(`
            UPDATE investor_accounts 
            SET shares = shares + $1, deposit_total = deposit_total + $2, updated_at = NOW()
            WHERE user_id = $3
          `, [sharesIssued.toString(), amount.toString(), userId]);
          
          // Update pool
          await db.query(`
            UPDATE investor_pools 
            SET tvl = tvl + $1, total_shares = total_shares + $2, total_deposits = total_deposits + $3, updated_at = NOW()
            WHERE id = (SELECT id FROM investor_pools LIMIT 1)
          `, [amount.toString(), sharesIssued.toString(), amount.toString()]);
          
          await logAnalytics('investor_deposit', amount, { userId, sharesIssued });
          await logAudit(userId, 'DEPOSIT', 'investor_account', account.id, { amount, sharesIssued, txHash });
          
          return res.status(200).json({
            success: true,
            data: {
              flowId,
              amount,
              sharesIssued,
              sharePrice,
              txHash
            }
          });
        } else if (action === 'withdraw') {
          if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid withdrawal amount required' });
          }
          
          const account = await QueryHelpers.getInvestorAccount(userId);
          if (!account) {
            return res.status(404).json({ error: 'Investor account not found' });
          }
          
          const pool = await QueryHelpers.getInvestorPool();
          const sharePrice = parseFloat(pool?.sharePrice || '1');
          const sharesNeeded = amount / sharePrice;
          const userShares = parseFloat(account.shares);
          
          if (sharesNeeded > userShares) {
            return res.status(400).json({ error: 'Insufficient shares for withdrawal' });
          }
          
          // Simulate Hedera transaction
          const txHash = await HederaService.transferTokens({
            from: 'investor_pool',
            to: userId,
            amount,
            tokenId: 'HBAR'
          });
          
          // Record withdrawal flow
          const flowId = generateId('flow');
          await db.query(`
            INSERT INTO investor_flows (id, user_id, type, amount, shares_delta, tx_hash, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          `, [
            flowId,
            userId,
            'WITHDRAW',
            amount.toString(),
            (-sharesNeeded).toString(),
            txHash,
            JSON.stringify({ idempotencyKey, sharePrice })
          ]);
          
          // Update investor account
          await db.query(`
            UPDATE investor_accounts 
            SET shares = shares - $1, withdraw_total = withdraw_total + $2, updated_at = NOW()
            WHERE user_id = $3
          `, [sharesNeeded.toString(), amount.toString(), userId]);
          
          // Update pool
          await db.query(`
            UPDATE investor_pools 
            SET tvl = tvl - $1, total_shares = total_shares - $2, total_withdrawals = total_withdrawals + $3, updated_at = NOW()
            WHERE id = (SELECT id FROM investor_pools LIMIT 1)
          `, [amount.toString(), sharesNeeded.toString(), amount.toString()]);
          
          await logAnalytics('investor_withdraw', amount, { userId, sharesRedeemed: sharesNeeded });
          await logAudit(userId, 'WITHDRAW', 'investor_account', account.id, { amount, sharesRedeemed: sharesNeeded, txHash });
          
          return res.status(200).json({
            success: true,
            data: {
              flowId,
              amount,
              sharesRedeemed: sharesNeeded,
              sharePrice,
              txHash
            }
          });
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Investor API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Export helper function for settlement processing
export async function processInvestorSettlement(orderId: string, settlementAmount: number) {
  try {
    const split = calculatePayoutSplit(settlementAmount);
    const investorAmount = split.payouts.investorPool;
    
    if (investorAmount > 0) {
      // Record settlement flow
      const flowId = generateId('flow');
      await db.query(`
        INSERT INTO investor_flows (id, type, amount, order_id, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        flowId,
        'CREDIT_FROM_SETTLEMENT',
        investorAmount.toString(),
        orderId,
        JSON.stringify({ settlementAmount, split: split.percentages })
      ]);
      
      // Update pool stats
      const stats = await updatePoolStats(investorAmount);
      
      // Update share price based on new TVL
      const pool = await QueryHelpers.getInvestorPool();
      const totalShares = parseFloat(pool?.totalShares || '1');
      const newSharePrice = stats.newTVL / totalShares;
      
      await db.query(`
        UPDATE investor_pools 
        SET share_price = $1, updated_at = NOW()
        WHERE id = (SELECT id FROM investor_pools LIMIT 1)
      `, [newSharePrice.toString()]);
      
      await logAnalytics('investor_settlement', investorAmount, { orderId, newTVL: stats.newTVL, newSharePrice });
      
      return {
        success: true,
        investorAmount,
        newTVL: stats.newTVL,
        newSharePrice,
        apr7d: stats.apr7d,
        apr30d: stats.apr30d
      };
    }
    
    return { success: true, investorAmount: 0 };
  } catch (error) {
    console.error('Error processing investor settlement:', error);
    throw error;
  }
}