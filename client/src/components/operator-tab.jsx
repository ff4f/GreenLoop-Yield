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
import { Textarea } from './ui/textarea';
import { 
  Package, 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { useAuth, PermissionGuard } from './wallet-guard';
import { PERMISSIONS } from '../../../shared/guards';

// Mock data - in real app this would come from API
const mockLots = [
  {
    id: 'lot-001',
    projectId: 'proj-001',
    projectName: 'Reforestation Kenya',
    farmerId: 'farmer-001',
    farmerName: 'John Kamau',
    totalTons: 100,
    availableTons: 75,
    pricePerTon: 25,
    status: 'listed',
    createdAt: '2024-01-15',
    verificationDate: '2024-01-20',
    expiryDate: '2024-12-31'
  },
  {
    id: 'lot-002',
    projectId: 'proj-002',
    projectName: 'Solar Farm Nigeria',
    farmerId: 'farmer-002',
    farmerName: 'Amina Hassan',
    totalTons: 200,
    availableTons: 200,
    pricePerTon: 30,
    status: 'pending_verification',
    createdAt: '2024-01-18',
    verificationDate: null,
    expiryDate: '2024-12-31'
  }
];

const mockOrders = [
  {
    id: 'order-001',
    lotId: 'lot-001',
    buyerId: 'buyer-001',
    buyerName: 'Green Corp',
    sellerId: 'farmer-001',
    sellerName: 'John Kamau',
    quantity: 25,
    pricePerTon: 25,
    totalAmount: 625,
    status: 'escrow',
    createdAt: '2024-01-22',
    deliveryDate: '2024-02-15'
  },
  {
    id: 'order-002',
    lotId: 'lot-002',
    buyerId: 'buyer-002',
    buyerName: 'EcoTech Ltd',
    sellerId: 'farmer-002',
    sellerName: 'Amina Hassan',
    quantity: 50,
    pricePerTon: 30,
    totalAmount: 1500,
    status: 'pending',
    createdAt: '2024-01-23',
    deliveryDate: '2024-02-20'
  }
];

const statusColors = {
  // Lot statuses
  draft: 'bg-gray-100 text-gray-800',
  pending_verification: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-blue-100 text-blue-800',
  listed: 'bg-green-100 text-green-800',
  partially_sold: 'bg-orange-100 text-orange-800',
  sold_out: 'bg-red-100 text-red-800',
  retired: 'bg-purple-100 text-purple-800',
  // Order statuses
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  escrow: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800'
};

function StatusBadge({ status }) {
  return (
    <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
}

function LotManagement() {
  const [lots, setLots] = useState(mockLots);
  const [filteredLots, setFilteredLots] = useState(mockLots);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    let filtered = lots;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lot => lot.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(lot => 
        lot.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredLots(filtered);
  }, [lots, statusFilter, searchTerm]);

  const handleStatusChange = (lotId, newStatus) => {
    setLots(prev => prev.map(lot => 
      lot.id === lotId ? { ...lot, status: newStatus } : lot
    ));
  };

  const handleVerifyLot = (lotId) => {
    handleStatusChange(lotId, 'verified');
  };

  const handleRejectLot = (lotId) => {
    handleStatusChange(lotId, 'draft');
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search lots by project, farmer, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_verification">Pending Verification</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="listed">Listed</SelectItem>
            <SelectItem value="partially_sold">Partially Sold</SelectItem>
            <SelectItem value="sold_out">Sold Out</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        <PermissionGuard permission={PERMISSIONS.CREATE_LOT}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Lot
          </Button>
        </PermissionGuard>
      </div>

      {/* Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Carbon Credit Lots ({filteredLots.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Tons</TableHead>
                <TableHead>Price/Ton</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-mono text-sm">{lot.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{lot.projectName}</div>
                      <div className="text-sm text-gray-500">{lot.projectId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{lot.farmerName}</div>
                      <div className="text-sm text-gray-500">{lot.farmerId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{lot.availableTons}/{lot.totalTons}</div>
                      <div className="text-sm text-gray-500">Available/Total</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${lot.pricePerTon}</TableCell>
                  <TableCell>
                    <StatusBadge status={lot.status} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(lot.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {lot.status === 'pending_verification' && (
                        <PermissionGuard permission={PERMISSIONS.VERIFY_LOT}>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleVerifyLot(lot.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRejectLot(lot.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </PermissionGuard>
                      )}
                      
                      <PermissionGuard permission={PERMISSIONS.UPDATE_LOT}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      
                      <PermissionGuard permission={PERMISSIONS.DELETE_LOT}>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderManagement() {
  const [orders, setOrders] = useState(mockOrders);
  const [filteredOrders, setFilteredOrders] = useState(mockOrders);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let filtered = orders;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search orders by buyer, seller, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="escrow">Escrow</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.buyerName}</div>
                      <div className="text-sm text-gray-500">{order.buyerId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.sellerName}</div>
                      <div className="text-sm text-gray-500">{order.sellerId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.quantity} tons</div>
                      <div className="text-sm text-gray-500">${order.pricePerTon}/ton</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${order.totalAmount}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {order.status === 'pending' && (
                        <PermissionGuard permission={PERMISSIONS.APPROVE_ORDER}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleStatusChange(order.id, 'confirmed')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <PermissionGuard permission={PERMISSIONS.PROCESS_ORDER}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleStatusChange(order.id, 'processing')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                      )}
                      
                      <PermissionGuard permission={PERMISSIONS.UPDATE_ORDER}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function OperatorDashboard() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const stats = {
    totalLots: mockLots.length,
    pendingVerification: mockLots.filter(lot => lot.status === 'pending_verification').length,
    activeLots: mockLots.filter(lot => lot.status === 'listed').length,
    totalOrders: mockOrders.length,
    pendingOrders: mockOrders.filter(order => order.status === 'pending').length,
    escrowOrders: mockOrders.filter(order => order.status === 'escrow').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Operator Dashboard</h2>
          <p className="text-gray-600">Manage carbon credit lots and orders</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Lots</p>
                <p className="text-2xl font-bold">{stats.totalLots}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Verification</p>
                <p className="text-2xl font-bold">{stats.pendingVerification}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Lots</p>
                <p className="text-2xl font-bold">{stats.activeLots}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">In Escrow</p>
                <p className="text-2xl font-bold">{stats.escrowOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OperatorTab() {
  return (
    <PermissionGuard permission={PERMISSIONS.ACCESS_OPERATOR_PANEL}>
      <div className="p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="lots">Lot Management</TabsTrigger>
            <TabsTrigger value="orders">Order Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <OperatorDashboard />
          </TabsContent>
          
          <TabsContent value="lots">
            <LotManagement />
          </TabsContent>
          
          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}