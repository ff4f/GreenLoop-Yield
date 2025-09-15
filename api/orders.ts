import { VercelRequest, VercelResponse } from '@vercel/node';

// @ts-ignore
import { OrderStatus, LotStatus, canTransitionOrderStatus, calculateOrderFees, ProofLink, MOCK_IDS } from '../shared/schema.js';
// @ts-ignore
import { db, QueryHelpers } from '../shared/database.js';
// @ts-ignore
import { HederaMockService } from '../shared/hedera-mock.js';
// @ts-ignore
import { HederaRealService } from '../shared/hedera-real.js';
// @ts-ignore
import { requireAuth, requirePermission, requireRole } from '../middleware/auth-guard.js';
// @ts-ignore
import { PERMISSIONS, USER_ROLES } from '../shared/guards.js';
// @ts-ignore
import { idempotencyMiddleware, requireIdempotencyKey } from '../middleware/idempotency.js';

// Use real or mock service based on environment
const HederaService = process.env.USE_REAL_HEDERA === 'true' ? HederaRealService : HederaMockService;

// Helper functions
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function logAnalytics(event: string, value: number, metadata: any): Promise<void> {
  await QueryHelpers.createAnalytics({
    event,
    value,
    metadata,
    userId: metadata.userId || 'system'
  });
}

async function logAudit(userId: string, action: string, resourceType: string, resourceId: string, metadata: any): Promise<void> {
  await QueryHelpers.createAuditLog({
    userId,
    action,
    entityType: resourceType,
    entityId: resourceId,
    changes: metadata
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query } = req;
  const orderId = query.id as string;
  const action = query.action as string;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authentication check for all methods
    const authResult = await requireAuth(req);
    if (authResult.error) {
      return res.status(401).json({ error: authResult.error });
    }
    switch (method) {
      case 'GET':
        // Permission check for viewing orders
        const viewPermissionResult = await requirePermission(req, PERMISSIONS.VIEW_ORDER);
        if (viewPermissionResult.error) {
          return res.status(403).json({ error: viewPermissionResult.error });
        }
        
        if (orderId) {
          // Get single order
          const order = await QueryHelpers.getOrderById(orderId);
          if (!order) {
            return res.status(404).json({ error: 'Order not found' });
          }
          
          // Get associated lot
          const lot = await QueryHelpers.getCarbonLotById(order.lotId);
          
          // Log view analytics
          await logAnalytics('order_view', 1, { orderId, status: order.status });
          
          return res.status(200).json({
            success: true,
            data: {
              ...order,
              lot: lot ? {
                id: lot.id,
                projectName: lot.projectName,
                type: lot.type,
                location: lot.location
              } : null
            },
            proofLinks: {
              marketplace: `/app#marketplace`,
              proofFeed: `/app#proof-feed`
            }
          });
        } else {
          // Get all orders with optional filtering
          const status = query.status as string;
          const buyerId = query.buyerId as string;
          const developerId = query.developerId as string;
          
          const filteredOrders = await QueryHelpers.getOrders({ 
            status: status as OrderStatus, 
            buyerId, 
            developerId 
          });
          
          // Enrich orders with lot data
          const enrichedOrders = await Promise.all(
            filteredOrders.map(async (order: any) => {
              const lot = await QueryHelpers.getCarbonLotById(order.lotId);
              return {
                ...order,
                lot: lot ? {
                  id: lot.id,
                  projectName: lot.projectName,
                  type: lot.type,
                  location: lot.location,
                  developerId: lot.developerId
                } : null
              };
            })
          );
          
          // Log orders view analytics
          await logAnalytics('orders_view', 1, { 
            totalOrders: filteredOrders.length,
            filters: { status, buyerId, developerId }
          });
          
          return res.status(200).json({
            success: true,
            data: enrichedOrders,
            meta: {
              total: filteredOrders.length,
              // map legacy keys to actual statuses
            pending: filteredOrders.filter((o: any) => o.status === OrderStatus.PENDING).length,
            confirmed: filteredOrders.filter((o: any) => o.status === OrderStatus.CONFIRMED).length,
            processing: filteredOrders.filter((o: any) => o.status === OrderStatus.PROCESSING).length,
            escrow: filteredOrders.filter((o: any) => o.status === OrderStatus.ESCROW).length,
            completed: filteredOrders.filter((o: any) => o.status === OrderStatus.COMPLETED).length
            },
            proofLinks: {
              marketplace: `/app#marketplace`,
              addProof: `/app#proof-feed`
            }
          });
        }

      case 'POST':
        // Permission check for creating orders
        const createPermissionResult = await requirePermission(req, PERMISSIONS.CREATE_ORDER);
        if (createPermissionResult.error) {
          return res.status(403).json({ error: createPermissionResult.error });
        }
        
        if (action === 'buy') {
          // Apply idempotency middleware for buy operation
          await new Promise((resolve, reject) => {
            idempotencyMiddleware(req, res, (err: any) => {
              if (err) reject(err);
              else resolve(null);
            });
          });
          
          // Require idempotency key for buy operation
          const idempotencyCheck = requireIdempotencyKey(req, res, () => {});
          if (idempotencyCheck) return;
          
          // Buy/Escrow action from Marketplace
          const { lotId, buyerId, tons, pricePerTon } = req.body;
          
          if (!lotId || !buyerId || !tons || !pricePerTon) {
            return res.status(400).json({ 
              error: 'Missing required fields: lotId, buyerId, tons, pricePerTon' 
            });
          }
          
          // Find the lot
          const lot = await QueryHelpers.getCarbonLotById(lotId);
          if (!lot) {
            return res.status(404).json({ 
              error: 'Lot not found',
              toast: {
                type: 'error',
                message: 'The selected carbon lot could not be found.'
              }
            });
          }
          
          // Check lot status
          if (lot.status !== LotStatus.LISTED) {
            return res.status(400).json({ 
              error: 'Lot is not available for purchase',
              toast: {
                type: 'error',
                message: 'This carbon lot is not currently available for purchase.'
              }
            });
          }
          
          // Check availability
          if (Number(lot.availableTons) < Number(tons)) {
            return res.status(400).json({ 
              error: 'Insufficient tons available',
              toast: {
                type: 'error',
                message: `Only ${lot.availableTons} tons available. You requested ${tons} tons.`
              }
            });
          }
          
          // Calculate fees
          const fees = calculateOrderFees(Number(tons), Number(pricePerTon));
          
          // Simulate Hedera operations
          await HederaService.simulateNetworkDelay(2000);
          
          // Create escrow transaction
          const escrowTx = await HederaService.transaction.createTransaction(
            'ESCROW',
            fees.total,
            `Escrow for ${tons} tons from ${lot.projectName}`
          );
          
          // Create new order
          const newOrderData = {
            id: `ORD-${Date.now()}`,
            lotId,
            buyerId,
            tons: Number(tons),
            pricePerTon: Number(pricePerTon),
            subtotal: fees.subtotal,
            platformFee: fees.platformFee,
            retirementFee: fees.retirementFee,
            total: fees.total,
            status: OrderStatus.ESCROW,
            escrowTxHash: escrowTx.transactionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const newOrder = await QueryHelpers.createOrder(newOrderData);
          
          // Update lot availability
          const newAvailableTons = Number(lot.availableTons) - Number(tons);
          const newLotStatus = newAvailableTons === 0 ? LotStatus.SOLD_OUT : LotStatus.PARTIALLY_SOLD;
          
          await QueryHelpers.updateCarbonLot(lotId, {
            availableTons: newAvailableTons,
            status: newLotStatus,
            updatedAt: new Date().toISOString()
          });
          
          // Log analytics and audit
          await logAnalytics('order_created', Number(tons), { 
            lotId, 
            buyerId, 
            total: fees.total,
            pricePerTon: Number(pricePerTon) 
          });
          
          await logAudit(buyerId, 'create_order', 'order', newOrder.id, {
            lotId,
            tons: Number(tons),
            total: fees.total,
            escrowTxHash: escrowTx.transactionId
          });
          
          return res.status(201).json({
            success: true,
            data: newOrder,
            proofOutputs: {
              orderId: newOrder.id,
              escrowTxId: escrowTx.transactionId,
              escrowAmount: `${fees.total} HBAR escrowed`,
              feeBreakdown: {
                subtotal: fees.subtotal,
                platformFee: `${fees.platformFee} (3%)`,
                retirementFee: `${fees.retirementFee} (5%)`,
                total: fees.total
              }
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(escrowTx.transactionId),
              order: `/app#orders`
            },
            toast: {
              type: 'success',
              message: `Order created successfully! ${tons} tons escrowed.`,
              links: [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(escrowTx.transactionId)
                },
                {
                  text: 'View Orders',
                  url: '/app#orders'
                }
              ]
            }
          });
        } else {
          // Create new order (standard CRUD)
          const orderData = req.body;
          const newOrderData = {
            id: generateId('order'),
            ...orderData,
            status: OrderStatus.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const newOrder = await QueryHelpers.createOrder(newOrderData);
          
          return res.status(201).json({
            success: true,
            data: newOrder
          });
        }

      case 'PUT':
        // Permission check for updating orders
        const updatePermissionResult = await requirePermission(req, PERMISSIONS.UPDATE_ORDER);
        if (updatePermissionResult.error) {
          return res.status(403).json({ error: updatePermissionResult.error });
        }
        
        if (!orderId) {
          return res.status(400).json({ error: 'Order ID is required' });
        }
        
        const existingOrder = await QueryHelpers.getOrderById(orderId);
        if (!existingOrder) {
          return res.status(404).json({ error: 'Order not found' });
        }
        
        if (action === 'mark-delivered') {
          // Apply idempotency middleware for deliver operation
          await new Promise((resolve, reject) => {
            idempotencyMiddleware(req, res, (err: any) => {
              if (err) reject(err);
              else resolve(null);
            });
          });
          
          // Require idempotency key for deliver operation
          const idempotencyCheck = requireIdempotencyKey(req, res, () => {});
          if (idempotencyCheck) return;
          
          // Mark Delivered action
          const { userId, deliveryProof } = req.body;
          
          if (!userId) {
            return res.status(400).json({ 
              error: 'Missing required field: userId' 
            });
          }
          
          // Check if transition is allowed
          if (!canTransitionOrderStatus(existingOrder.status, OrderStatus.COMPLETED, true)) {
            return res.status(400).json({ 
              error: `Cannot mark order as delivered from status ${existingOrder.status}`,
              toast: {
                type: 'error',
                message: 'Order must be escrowed before it can be marked as delivered.'
              }
            });
          }
          
          // Simulate Hedera operations
          await HederaService.simulateNetworkDelay(1500);
          
          // Upload delivery proof to HFS
          const deliveryFile = await HederaService.file.uploadFile(
            JSON.stringify(deliveryProof || { delivered: true, timestamp: new Date().toISOString() }),
            'application/json'
          );
          
          // Create delivery transaction
          const deliveryTx = await HederaService.transaction.createTransaction(
            'DELIVERY',
            0,
            `Delivery confirmation for order ${orderId}`
          );
          
          // Update order status -> COMPLETED
          const updatedOrder = await QueryHelpers.updateOrder(orderId, {
            status: OrderStatus.COMPLETED,
            deliveryRef: deliveryFile.fileId,
            updatedAt: new Date().toISOString()
          });
          
          // Log analytics and audit
          await logAnalytics('order_delivered', 1, { 
            orderId, 
            tons: existingOrder.tons,
            deliveryTxId: deliveryTx.transactionId 
          });
          
          await logAudit(userId, 'mark_delivered', 'order', orderId, {
            deliveryTxId: deliveryTx.transactionId,
            deliveryFileId: deliveryFile.fileId
          });
          
          return res.status(200).json({
            success: true,
            data: updatedOrder,
            proofOutputs: {
              deliveryTxId: deliveryTx.transactionId,
              deliveryFileId: deliveryFile.fileId,
              status: 'Delivered - awaiting escrow release'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(deliveryTx.transactionId),
              file: ProofLink.buildFileLink(deliveryFile.fileId)
            },
            toast: {
              type: 'success',
              message: 'Order marked as delivered successfully!',
              links: [
                {
                  text: 'View Delivery Transaction',
                  url: ProofLink.buildTransactionLink(deliveryTx.transactionId)
                }
              ]
            }
          });
        } else if (action === 'dispute') {
          // Apply idempotency middleware for dispute operation
          await new Promise((resolve, reject) => {
            idempotencyMiddleware(req, res, (err: any) => {
              if (err) reject(err);
              else resolve(null);
            });
          });
          
          // Require idempotency key for dispute operation
          const idempotencyCheck = requireIdempotencyKey(req, res, () => {});
          if (idempotencyCheck) return;
          
          // Raise Dispute action
          const { userId, reason } = req.body;
          
          if (!userId || !reason) {
            return res.status(400).json({ 
              error: 'Missing required fields: userId, reason' 
            });
          }
          
          // Check if order can be disputed (only ESCROW status)
          if (existingOrder.status !== OrderStatus.ESCROW) {
            return res.status(400).json({ 
              error: 'Order can only be disputed when in escrow status',
              toast: {
                type: 'error',
                message: 'Disputes can only be raised for orders in escrow.'
              }
            });
          }
          
          // Update order status to DISPUTED
          const disputedOrder = await QueryHelpers.updateOrder(orderId, {
            status: OrderStatus.DISPUTED,
            disputeReason: reason,
            disputeRaisedBy: userId,
            disputeRaisedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          // Log analytics and audit
          await logAnalytics('order_disputed', 1, { 
            orderId, 
            reason,
            raisedBy: userId
          });
          
          await logAudit(userId, 'raise_dispute', 'order', orderId, {
            reason,
            previousStatus: existingOrder.status
          });
          
          return res.status(200).json({
            success: true,
            data: disputedOrder,
            toast: {
              type: 'success',
              message: 'Dispute raised successfully. Admin will review your case.'
            }
          });
        } else if (action === 'resolve') {
          // Apply idempotency middleware for resolve operation
          await new Promise((resolve, reject) => {
            idempotencyMiddleware(req, res, (err: any) => {
              if (err) reject(err);
              else resolve(null);
            });
          });
          
          // Require idempotency key for resolve operation
          const idempotencyCheck = requireIdempotencyKey(req, res, () => {});
          if (idempotencyCheck) return;
          
          // Resolve Dispute action (Admin only)
          const { adminId, resolution, decision } = req.body;
          
          if (!adminId || !resolution || !decision) {
            return res.status(400).json({ 
              error: 'Missing required fields: adminId, resolution, decision' 
            });
          }
          
          // Check if order is disputed
          if (existingOrder.status !== OrderStatus.DISPUTED) {
            return res.status(400).json({ 
              error: 'Order is not in disputed status',
              toast: {
                type: 'error',
                message: 'Only disputed orders can be resolved.'
              }
            });
          }
          
          let newStatus;
          let payoutTx = null;
          
          if (decision === 'settle') {
            // Admin decides to settle - release escrow
            newStatus = OrderStatus.COMPLETED;
            
            // Calculate payout split
            const developerPayout = Number(existingOrder.total) * 0.7;
            const investorPoolCredit = Number(existingOrder.total) * 0.2;
            const platformFee = Number(existingOrder.total) * 0.1;
            
            // Simulate payout transaction
            payoutTx = await HederaService.transaction.createTransaction(
              'PAYOUT',
              Number(existingOrder.total),
              `Dispute resolved - settle order ${orderId}`
            );
            
            // Update investor pool TVL
            await QueryHelpers.updateInvestorPoolTVL(investorPoolCredit);
            
            // Log investor flow
            await QueryHelpers.createInvestorFlow({
              id: generateId('FLOW'),
              userId: null,
              type: 'CREDIT_FROM_SETTLEMENT',
              amount: investorPoolCredit,
              sharesDelta: 0,
              orderId: orderId,
              txHash: payoutTx.transactionId,
              metadata: { source: 'dispute_resolution_settle' },
              createdAt: new Date().toISOString()
            });
            
          } else if (decision === 'refund') {
            // Admin decides to refund - return money to buyer
            newStatus = OrderStatus.REFUNDED;
            
            // Simulate refund transaction
            payoutTx = await HederaService.transaction.createTransaction(
              'REFUND',
              Number(existingOrder.total),
              `Dispute resolved - refund order ${orderId}`
            );
            
            // Restore lot availability
            const lot = await QueryHelpers.getCarbonLotById(existingOrder.lotId);
            if (lot) {
              const newAvailableTons = Number(lot.availableTons) + Number(existingOrder.tons);
              const newLotStatus = newAvailableTons === Number(lot.totalTons) ? LotStatus.LISTED : LotStatus.PARTIALLY_SOLD;
              
              await QueryHelpers.updateCarbonLot(existingOrder.lotId, {
                availableTons: newAvailableTons,
                status: newLotStatus,
                updatedAt: new Date().toISOString()
              });
            }
          } else {
            return res.status(400).json({ 
              error: 'Invalid decision. Must be "settle" or "refund"' 
            });
          }
          
          // Update order with resolution
          const resolvedOrder = await QueryHelpers.updateOrder(orderId, {
            status: newStatus,
            disputeResolvedBy: adminId,
            disputeResolvedAt: new Date().toISOString(),
            disputeResolution: resolution,
            payoutTxHash: payoutTx?.transactionId,
            updatedAt: new Date().toISOString()
          });
          
          // Log analytics and audit
          await logAnalytics('dispute_resolved', 1, { 
            orderId, 
            decision,
            resolvedBy: adminId
          });
          
          await logAudit(adminId, 'resolve_dispute', 'order', orderId, {
            decision,
            resolution,
            previousStatus: OrderStatus.DISPUTED,
            newStatus,
            payoutTxId: payoutTx?.transactionId
          });
          
          return res.status(200).json({
            success: true,
            data: resolvedOrder,
            proofOutputs: {
              decision,
              resolution,
              txId: payoutTx?.transactionId,
              status: `Dispute resolved - ${decision}`
            },
            proofLinks: payoutTx ? {
              transaction: ProofLink.buildTransactionLink(payoutTx.transactionId)
            } : {},
            toast: {
              type: 'success',
              message: `Dispute resolved successfully. Decision: ${decision}`,
              links: payoutTx ? [
                {
                  text: 'View Transaction',
                  url: ProofLink.buildTransactionLink(payoutTx.transactionId)
                }
              ] : []
            }
          });
        } else if (action === 'release-escrow') {
          // Apply idempotency middleware for release-escrow operation
          await new Promise((resolve, reject) => {
            idempotencyMiddleware(req, res, (err: any) => {
              if (err) reject(err);
              else resolve(null);
            });
          });
          
          // Require idempotency key for release-escrow operation
          const idempotencyCheck = requireIdempotencyKey(req, res, () => {});
          if (idempotencyCheck) return;
          
          // Release Escrow action
          const { userId } = req.body;
          
          if (!userId) {
            return res.status(400).json({ 
              error: 'Missing required field: userId' 
            });
          }
          
          // Check if transition is allowed
          if (!canTransitionOrderStatus(existingOrder.status, OrderStatus.COMPLETED, true, true)) {
            return res.status(400).json({ 
              error: `Cannot release escrow from status ${existingOrder.status}`,
              toast: {
                type: 'error',
                message: 'Order must be delivered before escrow can be released.'
              }
            });
          }
          
          // Simulate Hedera operations
          await HederaService.simulateNetworkDelay(2000);
          
          // Calculate payout split (70% developer, 20% investor pool, 10% platform fee)
          const developerPayout = Number(existingOrder.subtotal) * 0.7;
          const investorPoolCredit = Number(existingOrder.subtotal) * 0.2;
          const platformFee = Number(existingOrder.subtotal) * 0.1;
          
          // Create payout transaction
          const payoutTx = await HederaService.transaction.createTransaction(
            'PAYOUT',
            developerPayout,
            `Payout for order ${orderId} - ${existingOrder.tons} tons delivered (70/20/10 split)`
          );
          
          // Record payout split
          await QueryHelpers.createPayoutSplit({
            orderId,
            developerAmount: developerPayout.toFixed(2),
            investorAmount: investorPoolCredit.toFixed(2),
            platformFee: platformFee.toFixed(2),
            txHash: payoutTx.transactionId
          });
          
          // Credit investor pool from settlement
          await QueryHelpers.creditInvestorPoolFromSettlement({
            amount: investorPoolCredit.toFixed(2),
            orderId,
            txHash: payoutTx.transactionId
          });
          
          // Update order status -> COMPLETED
          const completedOrder = await QueryHelpers.updateOrder(orderId, {
            status: OrderStatus.COMPLETED,
            payoutTxHash: payoutTx.transactionId,
            updatedAt: new Date().toISOString()
          });
          
          // Log analytics and audit
          await logAnalytics('order_settled', 1, { 
            orderId, 
            tons: existingOrder.tons,
            developerPayout: Number(developerPayout.toFixed(2)),
            investorPoolCredit: Number(investorPoolCredit.toFixed(2)),
            platformFee: Number(platformFee.toFixed(2)) 
          });
          
          await logAudit(userId, 'release_escrow', 'order', orderId, {
            payoutTxId: payoutTx.transactionId,
            developerPayout: Number(developerPayout.toFixed(2)),
            investorPoolCredit: Number(investorPoolCredit.toFixed(2)),
            platformFee: Number(platformFee.toFixed(2))
          });
          
          return res.status(200).json({
            success: true,
            data: completedOrder,
            proofOutputs: {
              payoutTxId: payoutTx.transactionId,
              developerPayout: `${developerPayout.toFixed(2)} HBAR (70%)`,
              investorPoolCredit: `${investorPoolCredit.toFixed(2)} HBAR (20%)`,
              platformFee: `${platformFee.toFixed(2)} HBAR (10%)`,
              status: 'Settled - escrow released'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(payoutTx.transactionId)
            },
            toast: {
              type: 'success',
              message: 'Escrow released successfully! Order settled.',
              links: [
                {
                  text: 'View Payout Transaction',
                  url: ProofLink.buildTransactionLink(payoutTx.transactionId)
                }
              ]
            }
          });
        } else {
          // Standard update
          const updateData = req.body;
          const updatedOrder = await QueryHelpers.updateOrder(orderId, {
            ...updateData,
            updatedAt: new Date().toISOString()
          });
          
          return res.status(200).json({
            success: true,
            data: updatedOrder
          });
        }

      case 'DELETE':
        // Permission check for deleting orders
        const deletePermissionResult = await requirePermission(req, PERMISSIONS.DELETE_ORDER);
        if (deletePermissionResult.error) {
          return res.status(403).json({ error: deletePermissionResult.error });
        }
        
        if (!orderId) {
          return res.status(400).json({ error: 'Order ID is required' });
        }
        
        const orderToDelete = await QueryHelpers.getOrderById(orderId);
        if (!orderToDelete) {
          return res.status(404).json({ error: 'Order not found' });
        }
        
        // Check if order can be deleted (only CREATED status)
        if (orderToDelete.status !== OrderStatus.PENDING) {
          return res.status(400).json({ 
            error: 'Only newly created orders can be deleted',
            toast: {
              type: 'error',
              message: 'Cannot delete order that has been escrowed or settled.'
            }
          });
        }
        
        await QueryHelpers.deleteOrder(orderId);
        
        return res.status(200).json({
          success: true,
          message: 'Order deleted successfully'
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Orders API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      toast: {
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      }
    });
  }
}