import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Activity,
  Clock,
  RefreshCw,
  Eye,
  Plus,
  Minus
} from 'lucide-react';
import { useAuth, PermissionGuard } from './wallet-guard';
import { PERMISSIONS } from '../../../shared/guards';

// Mock data - in real app this would come from API
const mockPoolStats = {
  tvl: '125,000.00',
  totalShares: '100,000.00000000',
  sharePrice: '1.25000000',
  apr: '12.50',
  totalDeposits: '150,000.00',
  totalWithdrawals: '25,000.00',
  lastSettlementAt: '2024-01-15T10:30:00Z'
};

const mockUserAccount = {
  shares: '1,250.50000000',
  depositTotal: '1,500.00',
  withdrawTotal: '0.00',
  currentValue: '1,563.13'
};

const mockFlows = [
  {
    id: 'flow-001',
    type: 'DEPOSIT',
    amount: '500.00',
    sharesDelta: '400.00000000',
    txHash: '0x1234...abcd',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'flow-002',
    type: 'CREDIT_FROM_SETTLEMENT',
    amount: '63.13',
    sharesDelta: '0.00000000',
    orderId: 'order-001',
    txHash: '0x5678...efgh',
    createdAt: '2024-01-14T15:45:00Z'
  },
  {
    id: 'flow-003',
    type: 'DEPOSIT',
    amount: '1000.00',
    sharesDelta: '850.50000000',
    txHash: '0x9abc...ijkl',
    createdAt: '2024-01-10T09:15:00Z'
  }
];

export default function InvestorTab() {
  const [poolStats, setPoolStats] = useState(mockPoolStats);
  const [userAccount, setUserAccount] = useState(mockUserAccount);
  const [flows, setFlows] = useState(mockFlows);
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const { user } = useAuth();

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pool stats
      const statsResponse = await fetch('/api/investor?action=stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setPoolStats(statsData.pool || mockPoolStats);
        setUserAccount(statsData.account || mockUserAccount);
      }

      // Fetch flows
      const flowsResponse = await fetch('/api/investor?action=flows');
      if (flowsResponse.ok) {
        const flowsData = await flowsResponse.json();
        setFlows(flowsData.flows || mockFlows);
      }
    } catch (error) {
      console.error('Error fetching investor data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle deposit
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/investor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `deposit_${Date.now()}_${Math.random()}`
        },
        body: JSON.stringify({
          action: 'deposit',
          amount: depositAmount,
          userId: user?.id || 'user_001'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Deposit successful:', result);
        setDepositAmount('');
        setIsDepositDialogOpen(false);
        await fetchData(); // Refresh data
      } else {
        const error = await response.json();
        console.error('Deposit failed:', error);
      }
    } catch (error) {
      console.error('Error during deposit:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/investor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `withdraw_${Date.now()}_${Math.random()}`
        },
        body: JSON.stringify({
          action: 'withdraw',
          amount: withdrawAmount,
          userId: user?.id || 'user_001'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Withdrawal successful:', result);
        setWithdrawAmount('');
        setIsWithdrawDialogOpen(false);
        await fetchData(); // Refresh data
      } else {
        const error = await response.json();
        console.error('Withdrawal failed:', error);
      }
    } catch (error) {
      console.error('Error during withdrawal:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  const formatShares = (shares) => {
    return parseFloat(shares).toFixed(8);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFlowIcon = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
      case 'WITHDRAW':
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      case 'CREDIT_FROM_SETTLEMENT':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getFlowBadgeColor = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-green-100 text-green-800';
      case 'WITHDRAW':
        return 'bg-red-100 text-red-800';
      case 'CREDIT_FROM_SETTLEMENT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Investor Pool</h2>
          <p className="text-muted-foreground">Manage your investments in the carbon credit pool</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Pool Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(poolStats.tvl)}</div>
            <p className="text-xs text-muted-foreground">Pool TVL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Share Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(poolStats.sharePrice)}</div>
            <p className="text-xs text-muted-foreground">Per share</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APR</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{poolStats.apr}%</div>
            <p className="text-xs text-muted-foreground">Annual return</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Position</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(userAccount.currentValue)}</div>
            <p className="text-xs text-muted-foreground">{formatShares(userAccount.shares)} shares</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Deposit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deposit to Investor Pool</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deposit-amount">Amount (USD)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="Enter amount to deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                You will receive approximately {depositAmount ? (parseFloat(depositAmount) / parseFloat(poolStats.sharePrice)).toFixed(8) : '0.00000000'} shares
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDepositDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleDeposit} disabled={loading || !depositAmount}>
                  {loading ? 'Processing...' : 'Deposit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Minus className="h-4 w-4" />
              Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw from Investor Pool</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="withdraw-amount">Amount (USD)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Enter amount to withdraw"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={userAccount.currentValue}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Available to withdraw: {formatCurrency(userAccount.currentValue)}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleWithdraw} disabled={loading || !withdrawAmount}>
                  {loading ? 'Processing...' : 'Withdraw'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for detailed view */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">My Account</TabsTrigger>
          <TabsTrigger value="flows">Transaction History</TabsTrigger>
          <TabsTrigger value="pool">Pool Details</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Shares:</span>
                    <span className="font-medium">{formatShares(userAccount.shares)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Value:</span>
                    <span className="font-medium">{formatCurrency(userAccount.currentValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Deposited:</span>
                    <span className="font-medium">{formatCurrency(userAccount.depositTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Withdrawn:</span>
                    <span className="font-medium">{formatCurrency(userAccount.withdrawTotal)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Unrealized Gain:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(parseFloat(userAccount.currentValue) - parseFloat(userAccount.depositTotal) + parseFloat(userAccount.withdrawTotal))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Share Price:</span>
                    <span className="font-medium">{formatCurrency(poolStats.sharePrice)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flows.map((flow) => (
                    <TableRow key={flow.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFlowIcon(flow.type)}
                          <Badge className={getFlowBadgeColor(flow.type)}>
                            {flow.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(flow.amount)}
                      </TableCell>
                      <TableCell>
                        {flow.sharesDelta !== '0.00000000' ? (
                          <span className={parseFloat(flow.sharesDelta) > 0 ? 'text-green-600' : 'text-red-600'}>
                            {parseFloat(flow.sharesDelta) > 0 ? '+' : ''}{formatShares(flow.sharesDelta)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(flow.createdAt)}
                      </TableCell>
                      <TableCell>
                        {flow.txHash && (
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pool" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pool Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Value Locked:</span>
                    <span className="font-medium">{formatCurrency(poolStats.tvl)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Shares:</span>
                    <span className="font-medium">{formatShares(poolStats.totalShares)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Share Price:</span>
                    <span className="font-medium">{formatCurrency(poolStats.sharePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Annual APR:</span>
                    <span className="font-medium">{poolStats.apr}%</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Deposits:</span>
                    <span className="font-medium">{formatCurrency(poolStats.totalDeposits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Withdrawals:</span>
                    <span className="font-medium">{formatCurrency(poolStats.totalWithdrawals)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Settlement:</span>
                    <span className="font-medium">
                      {poolStats.lastSettlementAt ? formatDate(poolStats.lastSettlementAt) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}