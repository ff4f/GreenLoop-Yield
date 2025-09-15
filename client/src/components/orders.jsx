import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Eye, Download, ExternalLink, TrendingUp, Percent, DollarSign, Zap, AlertTriangle } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MOCK_USERS } from '@shared/seed-data.js';

export default function Orders() {
  const { isConnected, isConnecting, connect, account } = useWallet();
  const queryClient = useQueryClient();
  const [disputeDialogOpen, setDisputeDialogOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [disputeReason, setDisputeReason] = React.useState('');
  
  // Map Hedera wallet accountId -> internal buyerId used by SEED_ORDERS
  const buyerUserId = React.useMemo(() => {
    const wallet = account?.accountId;
    if (!wallet) return undefined;
    const users = Object.values(MOCK_USERS || {});
    const found = users.find((u) => u?.wallet === wallet);
    return found?.id;
  }, [account?.accountId]);
  
  // Fetch orders from API (fallback handled in queryClient for /api/orders)
  const queryKey = buyerUserId
    ? ["/api", `orders?buyerId=${encodeURIComponent(buyerUserId)}`]
    : ["/api", "orders"];
  const { data: resp, isLoading, error } = useQuery({ queryKey });
  let orders = Array.isArray(resp?.data) ? resp.data : [];
  if (resp?.isFallback && buyerUserId) {
    orders = orders.filter((o) => o.buyerId === buyerUserId);
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (rate) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const getYieldStrategyBadge = (strategy) => {
    const strategies = {
      'carbon_appreciation': { label: 'Appreciation', variant: 'default' },
      'carbon_appreciation_staking': { label: 'Appreciation + Staking', variant: 'secondary' },
      'carbon_appreciation_liquidity': { label: 'Appreciation + LP', variant: 'outline' },
      'staking_only': { label: 'Staking Only', variant: 'destructive' }
    };
    return strategies[strategy] || { label: strategy, variant: 'default' };
  };

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'processing':
      case 'escrow':
        return 'outline';
      case 'disputed':
        return 'destructive';
      case 'cancelled':
      case 'refunded':
        return 'secondary';
      default:
        return 'destructive';
    }
  };
  
  // Mutation for raising dispute
  const disputeMutation = useMutation({
    mutationFn: async ({ orderId, reason }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'dispute',
          userId: buyerUserId,
          reason: reason
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to raise dispute');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Refresh orders data
      queryClient.invalidateQueries({ queryKey: ['/api', 'orders'] });
      
      // Close dialog and reset form
      setDisputeDialogOpen(false);
      setSelectedOrder(null);
      setDisputeReason('');
      
      // Show success message (if toast system is available)
      if (data.toast) {
        console.log('Dispute raised:', data.toast.message);
      }
    },
    onError: (error) => {
      console.error('Failed to raise dispute:', error.message);
    }
  });
  
  const handleRaiseDispute = (order) => {
    setSelectedOrder(order);
    setDisputeDialogOpen(true);
  };
  
  const handleSubmitDispute = () => {
    if (!selectedOrder || !disputeReason.trim()) return;
    
    disputeMutation.mutate({
      orderId: selectedOrder.id,
      reason: disputeReason.trim()
    });
  };
  
  const canRaiseDispute = (order) => {
    return order.status?.toLowerCase() === 'escrow';
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-foreground" aria-label="My carbon credit orders">Orders</h1>
        <p className="text-muted-foreground text-xs" aria-label="Page description">Automated escrow release upon delivery confirmation with HTS smart contract integration</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg" aria-label="Order history section">Your Carbon Credit Orders</CardTitle>
          <CardDescription className="text-xs" aria-label="Section description">
            Track your carbon credit purchases with real-time yield tracking and DeFi integration
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto" role="region" aria-label="Orders table">
            <Table role="table" aria-label="Carbon credit orders" className="text-sm">
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead scope="col" aria-label="Order identification number" className="py-2 text-xs">Order ID</TableHead>
                  <TableHead scope="col" aria-label="Carbon lot identification" className="py-2 text-xs">Lot ID</TableHead>
                  <TableHead scope="col" aria-label="Quantity purchased" className="py-2 text-xs">Quantity</TableHead>
                  <TableHead scope="col" aria-label="Price per tonne" className="py-2 text-xs">Price</TableHead>
                  <TableHead scope="col" aria-label="Total purchase amount" className="py-2 text-xs">Total</TableHead>
                  <TableHead scope="col" aria-label="DeFi yield strategy" className="py-2 text-xs">Yield Strategy</TableHead>
                  <TableHead scope="col" aria-label="Current market value" className="py-2 text-xs">Current Value</TableHead>
                  <TableHead scope="col" aria-label="Yield earned to date" className="py-2 text-xs">Yield Earned</TableHead>
                  <TableHead scope="col" aria-label="Annual percentage yield" className="py-2 text-xs">APY</TableHead>
                  <TableHead scope="col" aria-label="Order status" className="py-2 text-xs">Status</TableHead>
                  <TableHead scope="col" aria-label="Available actions" className="py-2 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {!isConnected ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-16">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sky-500/10 flex items-center justify-center">
                        <svg className="w-10 h-10 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Connect Wallet to View Orders</h3>
                      <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                        Your on-chain order history is tied to your Hedera account. Connect your wallet to load orders.
                      </p>
                      <Button
                        onClick={connect}
                        disabled={isConnecting}
                        className="h-8 text-sm rounded-lg"
                      >
                        {isConnecting ? 'Connecting…' : 'Connect Wallet'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-6 text-muted-foreground">Loading orders…</TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-6 text-red-300">Failed to load orders.</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-16">
                      <div className="mb-6">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">No Orders Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                          You haven't purchased any carbon credits yet. Browse the marketplace to start building your carbon portfolio with automated yield strategies.
                        </p>
                        <div className="text-sm text-muted-foreground">
                          <p>💡 Tip: Visit the Marketplace tab to explore available carbon credit lots</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                orders.map((order) => {
                const yieldStrategy = getYieldStrategyBadge(order.yieldStrategy || 'carbon_appreciation');
                const yieldEarned = order.yieldEarned || 0;
                const currentValue = order.currentValue || order.totalAmount;
                const expectedAPY = order.expectedAPY || 0;
                const isPositiveYield = yieldEarned > 0;
                
                return (
                  <TableRow key={order.id} role="row" className="h-10">
                    <TableCell className="font-medium py-2" role="cell" aria-label={`Order ID: ${order.id}`}>{order.id}</TableCell>
                    <TableCell className="py-2" role="cell" aria-label={`Lot ID: ${order.lotId}`}>{order.lotId}</TableCell>
                    <TableCell className="py-2" role="cell" aria-label={`Quantity: ${order.tons} tonnes CO2 equivalent`}>{order.tons} tCO2e</TableCell>
                    <TableCell className="py-2" role="cell" aria-label={`Price per tonne: ${formatCurrency(order.pricePerTon)}`}>{formatCurrency(order.pricePerTon)}</TableCell>
                    <TableCell className="py-2" role="cell" aria-label={`Total amount: ${formatCurrency(order.totalAmount)}`}>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell className="py-2" role="cell">
                      <Badge variant={yieldStrategy.variant} className="text-xs px-1.5 py-0.5" aria-label={`Yield strategy: ${yieldStrategy.label}`}>
                        {yieldStrategy.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2" role="cell">
                      <div className="flex flex-col space-y-0.5">
                        <span className="font-medium text-sm" aria-label={`Current value: ${formatCurrency(currentValue)}`}>{formatCurrency(currentValue)}</span>
                        {currentValue !== order.totalAmount && (
                          <span className={`${currentValue > order.totalAmount ? 'text-green-600' : 'text-red-600'} text-xs`} aria-label={`Value change: ${currentValue > order.totalAmount ? 'gain of' : 'loss of'} ${formatCurrency(Math.abs(currentValue - order.totalAmount))}`}>
                            {currentValue > order.totalAmount ? '+' : ''}
                            {formatCurrency(currentValue - order.totalAmount)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2" role="cell">
                      <div className="flex items-center gap-1">
                        {isPositiveYield ? (
                          <TrendingUp className="h-3 w-3 text-green-600" aria-hidden="true" />
                        ) : (
                          <DollarSign className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        )}
                        <span className={`font-medium text-sm ${isPositiveYield ? 'text-green-600' : 'text-muted-foreground'}`} aria-label={`Yield earned: ${formatCurrency(yieldEarned)}`}>
                          {formatCurrency(yieldEarned)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2" role="cell">
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-blue-600" aria-hidden="true" />
                        <span className="font-medium text-sm text-blue-600" aria-label={`Expected APY: ${formatPercentage(expectedAPY)}`}>
                          {formatPercentage(expectedAPY)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2" role="cell">
                      <Badge variant={getStatusVariant(order.status)} className="text-xs px-1.5 py-0.5" aria-label={`Order status: ${order.status}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2" role="cell">
                      <div className="flex gap-0.5">
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" title="View Details" aria-label="View order details">
                          <Eye className="h-3 w-3" aria-hidden="true" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" title="Download Certificate" aria-label="Download carbon credit certificate">
                          <Download className="h-3 w-3" aria-hidden="true" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" title="View on Hedera" aria-label="View transaction on Hedera network">
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </Button>
                        {canRaiseDispute(order) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                            title="Raise Dispute" 
                            aria-label="Raise dispute for this order"
                            onClick={() => handleRaiseDispute(order)}
                          >
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
                  })
                )
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Raise Dispute</DialogTitle>
            <DialogDescription>
              Raise a dispute for order {selectedOrder?.id}. Please provide a detailed reason for the dispute.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dispute-reason">Dispute Reason</Label>
              <Textarea
                id="dispute-reason"
                placeholder="Please describe the issue with this order in detail..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            {selectedOrder && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <div><strong>Order ID:</strong> {selectedOrder.id}</div>
                <div><strong>Lot ID:</strong> {selectedOrder.lotId}</div>
                <div><strong>Amount:</strong> {formatCurrency(selectedOrder.totalAmount)}</div>
                <div><strong>Status:</strong> {selectedOrder.status}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDisputeDialogOpen(false);
                setSelectedOrder(null);
                setDisputeReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitDispute}
              disabled={!disputeReason.trim() || disputeMutation.isPending}
            >
              {disputeMutation.isPending ? 'Submitting...' : 'Raise Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
