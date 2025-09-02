import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ExternalLink, Eye, CheckCircle, DollarSign, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hederaService } from "@/lib/hedera-mock";
import { MOCK_IDS } from "@shared/schema.js";
import { SUCCESS_MESSAGES, GUARDS } from "@/constants/microcopy";
import { useProofStore } from "@/contexts/proof-store";

const OrdersTable = ({ orders = [] }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { toast } = useToast();
  const { addEvidence } = useProofStore();

  const openHashscan = (id) => {
    const isTransaction = id.startsWith('0x');
    const baseUrl = 'https://hashscan.io/testnet';
    const url = isTransaction ? `${baseUrl}/transaction/${id}` : `${baseUrl}/file/${id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      const deliveryResult = await hederaService.deliveryTransfer(orderId, "0.0.123456");
      
      // Add evidence for delivery certificate file
      addEvidence({
        kind: "file",
        lotId: selectedOrder?.lotId || "Unknown",
        metadata: {
          fileId: deliveryResult.deliveryCertFileId,
          transactionHash: deliveryResult.transactionHash,
          timestamp: new Date().toISOString(),
          description: "Delivery certificate uploaded"
        }
      });

      // Add evidence for ORDER_DELIVERED topic message
      addEvidence({
        kind: "topic",
        lotId: selectedOrder?.lotId || "Unknown",
        metadata: {
          topicId: deliveryResult.topicId,
          sequenceNumber: deliveryResult.sequenceNumber,
          transactionHash: deliveryResult.topicTxHash,
          timestamp: new Date().toISOString(),
          description: "ORDER_DELIVERED message submitted"
        }
      });
      
      toast({
        title: SUCCESS_MESSAGES.ACTIONS.ORDER_DELIVERED || "Delivery Confirmed Successfully",
        description: (
          <div className="space-y-1">
            <p>Carbon credits marked as delivered.</p>
            <div className="flex items-center gap-2 text-sm">
              <span>Delivery Cert:</span>
              <a 
                href={`https://hashscan.io/testnet/file/${deliveryResult.deliveryCertFileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                {deliveryResult.deliveryCertFileId}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ),
      });
    } catch (error) {
      toast({
        title: "Delivery Confirmation Failed",
        description: "Unable to confirm delivery. Please verify transaction status and try again.",
        variant: "destructive",
      });
    }
  };

  const handleReleaseEscrow = async (orderId) => {
    try {
      const payoutResult = await hederaService.payoutTransfer(orderId, "0.0.456789");
      
      // Add evidence for payout transaction
      addEvidence({
        kind: "transaction",
        lotId: selectedOrder?.lotId || "Unknown",
        metadata: {
          transactionHash: payoutResult.transactionHash,
          timestamp: new Date().toISOString(),
          description: "Escrow payout transaction completed"
        }
      });
      
      toast({
        title: SUCCESS_MESSAGES.ACTIONS.ESCROW_RELEASED || "Escrow Released Successfully",
        description: (
          <div className="space-y-1">
            <p>Payment released from escrow to seller.</p>
            <div className="flex items-center gap-2 text-sm">
              <span>Payout Tx:</span>
              <a 
                href={`https://hashscan.io/testnet/transaction/${payoutResult.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                {payoutResult.transactionHash}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ),
      });
    } catch (error) {
      toast({
        title: "Escrow Release Failed",
        description: "Unable to release escrow payment. Please verify transaction status and try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'ESCROWED': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'DELIVERED': { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'SETTLED': { variant: 'secondary', className: 'bg-green-100 text-green-800 border-green-200' }
    };
    
    const config = variants[status] || variants['ESCROWED'];
    
    return (
      <Badge variant={config.variant} className={`text-xs font-medium ${config.className}`}>
        {status}
      </Badge>
    );
  };

  const getTimelineSteps = (order) => {
    const steps = [
      {
        label: 'Escrowed',
        completed: true,
        hash: order.escrowTxHash,
        timestamp: '2025-01-20 14:30:00'
      },
      {
        label: 'Delivered',
        completed: order.status === 'DELIVERED' || order.status === 'SETTLED',
        hash: order.deliveryTxHash,
        timestamp: order.status === 'DELIVERED' || order.status === 'SETTLED' ? '2025-01-21 09:15:00' : null
      },
      {
        label: 'Settled',
        completed: order.status === 'SETTLED',
        hash: order.payoutTxHash,
        timestamp: order.status === 'SETTLED' ? '2025-01-21 16:45:00' : null
      }
    ];
    
    return steps;
  };

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-xs font-medium text-muted-foreground h-9">Order ID</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-9">Lot</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-9">Qty (t)</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-9">$/t</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-9">Value</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-9">Status</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-9">Docs</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-9">Tx</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground h-9">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow 
                key={order.orderId}
                className="border-white/10 hover:bg-white/5 cursor-pointer h-[38px]"
                onClick={() => handleRowClick(order)}
              >
                <TableCell className="text-xs font-mono py-2">{order.orderId}</TableCell>
                <TableCell className="text-xs py-2">{order.lotId}</TableCell>
                <TableCell className="text-xs tabular-nums py-2">{order.quantity}</TableCell>
                <TableCell className="text-xs tabular-nums py-2">${order.pricePerTon}</TableCell>
                <TableCell className="text-xs tabular-nums py-2">${order.totalValue?.toLocaleString()}</TableCell>
                <TableCell className="text-xs py-2">
                  {getStatusBadge(order.status)}
                </TableCell>
                <TableCell className="text-xs py-2">
                  {order.contractFileId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openHashscan(order.contractFileId);
                      }}
                      className="h-6 px-2 text-xs rounded-lg hover:bg-white/10 text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-xs py-2">
                  {order.escrowTxHash && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openHashscan(order.escrowTxHash);
                      }}
                      className="h-6 px-2 text-xs rounded-lg hover:bg-white/10 text-blue-400 hover:text-blue-300 font-mono"
                    >
                      {order.escrowTxHash.slice(0, 8)}...
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-xs py-2">
                  {order.status === 'ESCROWED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                        handleMarkDelivered(order.orderId);
                      }}
                      className="h-6 px-2 text-xs rounded-lg hover:bg-white/10 text-green-400 hover:text-green-300"
                    >
                      <Truck className="w-3 h-3 mr-1" />
                      Mark Delivered
                    </Button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                        handleReleaseEscrow(order.orderId);
                      }}
                      className="h-6 px-2 text-xs rounded-lg hover:bg-white/10 text-blue-400 hover:text-blue-300"
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Release Escrow
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Side Panel Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-background border-white/10">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold">
              Order Details - {selectedOrder?.orderId}
            </SheetTitle>
          </SheetHeader>
          
          {selectedOrder && (
            <div className="mt-4 space-y-4">
              {/* Order Summary */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold">Order Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Lot ID</div>
                    <div className="font-medium">{selectedOrder.lotId}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Quantity</div>
                    <div className="font-medium tabular-nums">{selectedOrder.quantity} tCO2e</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Price per Ton</div>
                    <div className="font-medium tabular-nums">${selectedOrder.pricePerTon}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total Value</div>
                    <div className="font-medium tabular-nums">${selectedOrder.totalValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Buyer Account</div>
                    <div className="font-mono text-xs">{selectedOrder.buyerAccount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-4">Transaction Timeline</h3>
                <div className="space-y-4">
                  {getTimelineSteps(selectedOrder).map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        step.completed 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-white/10 text-muted-foreground border border-white/20'
                      }`}>
                        {step.completed ? '✓' : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{step.label}</div>
                        {step.timestamp && (
                          <div className="text-xs text-muted-foreground">{step.timestamp}</div>
                        )}
                        {step.hash && (
                          <button
                            onClick={() => openHashscan(step.hash)}
                            className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1"
                          >
                            {step.hash}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {selectedOrder.status === 'ESCROWED' && (
                  <Button
                    onClick={() => handleMarkDelivered(selectedOrder.orderId)}
                    className="w-full h-9 text-sm rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Delivered
                  </Button>
                )}
                {selectedOrder.status === 'DELIVERED' && (
                  <Button
                    onClick={() => handleReleaseEscrow(selectedOrder.orderId)}
                    className="w-full h-9 text-sm rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Release Escrow
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => openHashscan(selectedOrder.contractFileId)}
                  className="w-full h-9 text-sm rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Contract
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default OrdersTable;