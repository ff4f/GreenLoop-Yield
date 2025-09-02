import { VercelRequest, VercelResponse } from '@vercel/node';

import { OrderStatus, LotStatus, canTransitionOrderStatus, calculateOrderFees, ProofLink, MOCK_IDS } from '../shared/schema.js';
import { db, QueryHelpers } from '../shared/database.js';
import { HederaMockService } from '../shared/hedera-mock.js';

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
    switch (method) {
      case 'GET':
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
            filteredOrders.map(async (order) => {
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
              pending: filteredOrders.filter(o => o.status === OrderStatus.PENDING).length,
              escrowed: filteredOrders.filter(o => o.status === OrderStatus.ESCROWED).length,
              delivered: filteredOrders.filter(o => o.status === OrderStatus.DELIVERED).length,
              completed: filteredOrders.filter(o => o.status === OrderStatus.COMPLETED).length
            },
            proofLinks: {
              marketplace: `/app#marketplace`,
              addProof: `/app#proof-feed`
            }
          });
        }

      case 'POST':
        if (action === 'buy') {
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
          if (lot.availableTons < tons) {
            return res.status(400).json({ 
              error: 'Insufficient tons available',
              toast: {
                type: 'error',
                message: `Only ${lot.availableTons} tons available. You requested ${tons} tons.`
              }
            });
          }
          
          // Calculate fees
          const fees = calculateOrderFees(tons, pricePerTon);
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(2000);
          
          // Create escrow transaction
          const escrowTx = await HederaMockService.transaction.createTransaction(
            'ESCROW',
            fees.totalAmount,
            `Escrow for ${tons} tons from ${lot.projectName}`
          );
          
          // Create new order
          const newOrderData = {
            id: generateId('order'),
            lotId,
            buyerId,
            tons,
            pricePerTon,
            subtotal: fees.subtotal,
            buyerFee: fees.buyerFee,
            developerFee: fees.developerFee,
            totalAmount: fees.totalAmount,
            status: OrderStatus.ESCROWED,
            escrowTxId: escrowTx.transactionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const newOrder = await QueryHelpers.createOrder(newOrderData);
          
          // Update lot availability
          const newAvailableTons = lot.availableTons - tons;
          const newLotStatus = newAvailableTons === 0 ? LotStatus.ESCROWED : lot.status;
          
          await QueryHelpers.updateCarbonLot(lotId, {
            availableTons: newAvailableTons,
            status: newLotStatus,
            updatedAt: new Date().toISOString()
          });
          
          // Log analytics and audit
          await logAnalytics('order_created', tons, { 
            lotId, 
            buyerId, 
            totalAmount: fees.totalAmount,
            pricePerTon 
          });
          
          await logAudit(buyerId, 'create_order', 'order', newOrder.id, {
            lotId,
            tons,
            totalAmount: fees.totalAmount,
            escrowTxId: escrowTx.transactionId
          });
          
          return res.status(201).json({
            success: true,
            data: newOrder,
            proofOutputs: {
              orderId: newOrder.id,
              escrowTxId: escrowTx.transactionId,
              escrowAmount: `${fees.totalAmount} HBAR escrowed`,
              feeBreakdown: {
                subtotal: fees.subtotal,
                buyerFee: `${fees.buyerFee} (3%)`,
                developerFee: `${fees.developerFee} (5%)`,
                total: fees.totalAmount
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
        if (!orderId) {
          return res.status(400).json({ error: 'Order ID is required' });
        }
        
        const existingOrder = await QueryHelpers.getOrderById(orderId);
        if (!existingOrder) {
          return res.status(404).json({ error: 'Order not found' });
        }
        
        if (action === 'mark-delivered') {
          // Mark Delivered action
          const { userId, deliveryProof } = req.body;
          
          if (!userId) {
            return res.status(400).json({ 
              error: 'Missing required field: userId' 
            });
          }
          
          // Check if transition is allowed
          if (!canTransitionOrderStatus(existingOrder.status, OrderStatus.DELIVERED)) {
            return res.status(400).json({ 
              error: `Cannot mark order as delivered from status ${existingOrder.status}`,
              toast: {
                type: 'error',
                message: 'Order must be escrowed before it can be marked as delivered.'
              }
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(1500);
          
          // Upload delivery proof to HFS
          const deliveryFile = await HederaMockService.file.uploadFile(
            JSON.stringify(deliveryProof || { delivered: true, timestamp: new Date().toISOString() }),
            'application/json'
          );
          
          // Create delivery transaction
          const deliveryTx = await HederaMockService.transaction.createTransaction(
            'DELIVERY',
            0,
            `Delivery confirmation for order ${orderId}`
          );
          
          // Update order status
          const updatedOrder = await QueryHelpers.updateOrder(orderId, {
            status: OrderStatus.DELIVERED,
            deliveryTxId: deliveryTx.transactionId,
            deliveryFileId: deliveryFile.fileId,
            deliveredAt: new Date().toISOString(),
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
        } else if (action === 'release-escrow') {
          // Release Escrow action
          const { userId } = req.body;
          
          if (!userId) {
            return res.status(400).json({ 
              error: 'Missing required field: userId' 
            });
          }
          
          // Check if transition is allowed
          if (!canTransitionOrderStatus(existingOrder.status, OrderStatus.COMPLETED)) {
            return res.status(400).json({ 
              error: `Cannot release escrow from status ${existingOrder.status}`,
              toast: {
                type: 'error',
                message: 'Order must be delivered before escrow can be released.'
              }
            });
          }
          
          // Simulate Hedera operations
          await HederaMockService.simulateNetworkDelay(2000);
          
          // Calculate payout split (90% to developer, 10% platform fee)
          const developerPayout = existingOrder.subtotal * 0.9;
          const platformFee = existingOrder.subtotal * 0.1;
          
          // Create payout transaction
          const payoutTx = await HederaMockService.transaction.createTransaction(
            'PAYOUT',
            developerPayout,
            `Payout for order ${orderId} - ${existingOrder.tons} tons delivered`
          );
          
          // Update order status
          const completedOrder = await QueryHelpers.updateOrder(orderId, {
            status: OrderStatus.COMPLETED,
            payoutTxId: payoutTx.transactionId,
            developerPayout,
            platformFee,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          // Log analytics and audit
          await logAnalytics('order_completed', 1, { 
            orderId, 
            tons: existingOrder.tons,
            developerPayout,
            platformFee 
          });
          
          await logAudit(userId, 'release_escrow', 'order', orderId, {
            payoutTxId: payoutTx.transactionId,
            developerPayout,
            platformFee
          });
          
          return res.status(200).json({
            success: true,
            data: completedOrder,
            proofOutputs: {
              payoutTxId: payoutTx.transactionId,
              developerPayout: `${developerPayout} HBAR (90%)`,
              platformFee: `${platformFee} HBAR (10%)`,
              status: 'Completed - escrow released'
            },
            proofLinks: {
              transaction: ProofLink.buildTransactionLink(payoutTx.transactionId)
            },
            toast: {
              type: 'success',
              message: 'Escrow released successfully! Order completed.',
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
        if (!orderId) {
          return res.status(400).json({ error: 'Order ID is required' });
        }
        
        const orderToDelete = await QueryHelpers.getOrderById(orderId);
        if (!orderToDelete) {
          return res.status(404).json({ error: 'Order not found' });
        }
        
        // Check if order can be deleted (only PENDING status)
        if (orderToDelete.status !== OrderStatus.PENDING) {
          return res.status(400).json({ 
            error: 'Only pending orders can be deleted',
            toast: {
              type: 'error',
              message: 'Cannot delete order that has been escrowed or completed.'
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