import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, ExternalLink, TrendingUp, Percent, DollarSign, Zap } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { mockOrders } from "@/lib/hedera-mock";

export default function Orders() {
  const { isConnected, isConnecting, connect } = useWallet();
  
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
        return 'outline';
      default:
        return 'destructive';
    }
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
                mockOrders.length === 0 ? (
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
                mockOrders.map((order) => {
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
                          <span className={`text-xs ${currentValue > order.totalAmount ? 'text-green-600' : 'text-red-600'}`} aria-label={`Value change: ${currentValue > order.totalAmount ? 'gain of' : 'loss of'} ${formatCurrency(Math.abs(currentValue - order.totalAmount))}`}>
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
    </>
  );
}
