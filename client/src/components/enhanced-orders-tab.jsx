import React, { useState, useEffect, useMemo } from 'react';
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
import { DatePicker } from './ui/date-picker';
import { 
  ShoppingCart, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
  Package,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  RefreshCw
} from 'lucide-react';
import { useAuth, PermissionGuard } from './wallet-guard';
import { PERMISSIONS } from '../../../shared/guards';

// Enhanced mock data with more fields
const mockOrders = [
  {
    id: 'ORD-2024-001',
    lotId: 'LOT-001',
    lotName: 'Kenya Reforestation Q1',
    buyerId: 'buyer-001',
    buyerName: 'Green Energy Corp',
    buyerEmail: 'procurement@greenenergy.com',
    sellerId: 'farmer-001',
    sellerName: 'John Kamau',
    sellerEmail: 'john.kamau@email.com',
    quantity: 25,
    pricePerTon: 25,
    totalAmount: 625,
    currency: 'USD',
    status: 'escrow',
    priority: 'high',
    createdAt: '2024-01-22T10:30:00Z',
    updatedAt: '2024-01-23T14:20:00Z',
    deliveryDate: '2024-02-15T00:00:00Z',
    paymentMethod: 'crypto',
    escrowAddress: '0x1234...5678',
    transactionHash: '0xabcd...efgh',
    notes: 'Urgent delivery required for compliance reporting',
    tags: ['urgent', 'compliance'],
    region: 'Africa',
    projectType: 'Reforestation'
  },
  {
    id: 'ORD-2024-002',
    lotId: 'LOT-002',
    lotName: 'Nigeria Solar Farm Credits',
    buyerId: 'buyer-002',
    buyerName: 'EcoTech Solutions',
    buyerEmail: 'orders@ecotech.com',
    sellerId: 'farmer-002',
    sellerName: 'Amina Hassan',
    sellerEmail: 'amina.hassan@email.com',
    quantity: 50,
    pricePerTon: 30,
    totalAmount: 1500,
    currency: 'USD',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-01-23T09:15:00Z',
    updatedAt: '2024-01-23T09:15:00Z',
    deliveryDate: '2024-02-20T00:00:00Z',
    paymentMethod: 'bank_transfer',
    escrowAddress: null,
    transactionHash: null,
    notes: 'Standard delivery timeline acceptable',
    tags: ['renewable', 'solar'],
    region: 'Africa',
    projectType: 'Solar Energy'
  },
  {
    id: 'ORD-2024-003',
    lotId: 'LOT-003',
    lotName: 'Ghana Wind Power Initiative',
    buyerId: 'buyer-003',
    buyerName: 'Carbon Neutral Inc',
    buyerEmail: 'purchasing@carbonneutral.com',
    sellerId: 'farmer-003',
    sellerName: 'Kwame Asante',
    sellerEmail: 'kwame.asante@email.com',
    quantity: 100,
    pricePerTon: 28,
    totalAmount: 2800,
    currency: 'USD',
    status: 'completed',
    priority: 'low',
    createdAt: '2024-01-20T16:45:00Z',
    updatedAt: '2024-01-25T11:30:00Z',
    deliveryDate: '2024-01-25T00:00:00Z',
    paymentMethod: 'crypto',
    escrowAddress: '0x9876...5432',
    transactionHash: '0xijkl...mnop',
    notes: 'Delivered ahead of schedule',
    tags: ['wind', 'completed'],
    region: 'Africa',
    projectType: 'Wind Energy'
  }
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  escrow: 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-purple-100 text-purple-800 border-purple-200',
  disputed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

function StatusBadge({ status }) {
  return (
    <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-800'} border`}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
}

function PriorityBadge({ priority }) {
  return (
    <Badge variant="outline" className={priorityColors[priority] || 'bg-gray-100 text-gray-800'}>
      {priority.toUpperCase()}
    </Badge>
  );
}

function OrderDetailsDialog({ order, isOpen, onClose }) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Order Details - {order.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Order ID</Label>
                <p className="font-mono text-sm">{order.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Lot</Label>
                <p>{order.lotName} ({order.lotId})</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <PriorityBadge priority={order.priority} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Created</Label>
                <p>{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                <p>{new Date(order.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Quantity</Label>
                <p className="font-medium">{order.quantity} tons</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Price per Ton</Label>
                <p className="font-medium">${order.pricePerTon} {order.currency}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                <p className="text-lg font-bold text-green-600">${order.totalAmount} {order.currency}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                <p className="capitalize">{order.paymentMethod.replace('_', ' ')}</p>
              </div>
              {order.escrowAddress && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Escrow Address</Label>
                  <p className="font-mono text-sm break-all">{order.escrowAddress}</p>
                </div>
              )}
              {order.transactionHash && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Transaction Hash</Label>
                  <p className="font-mono text-sm break-all">{order.transactionHash}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buyer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buyer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Company</Label>
                <p className="font-medium">{order.buyerName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Buyer ID</Label>
                <p className="font-mono text-sm">{order.buyerId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <p>{order.buyerEmail}</p>
              </div>
            </CardContent>
          </Card>

          {/* Seller Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Name</Label>
                <p className="font-medium">{order.sellerName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Seller ID</Label>
                <p className="font-mono text-sm">{order.sellerId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <p>{order.sellerEmail}</p>
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Project Type</Label>
                <p>{order.projectType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Region</Label>
                <p>{order.region}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Delivery Date</Label>
                <p>{new Date(order.deliveryDate).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {order.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{order.notes || 'No notes available'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <PermissionGuard permission={PERMISSIONS.UPDATE_ORDER}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Order
            </Button>
          </PermissionGuard>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdvancedFilters({ filters, onFiltersChange, onReset }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Advanced Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
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

          <div>
            <Label>Priority</Label>
            <Select value={filters.priority} onValueChange={(value) => onFiltersChange({ ...filters, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Project Type</Label>
            <Select value={filters.projectType} onValueChange={(value) => onFiltersChange({ ...filters, projectType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Reforestation">Reforestation</SelectItem>
                <SelectItem value="Solar Energy">Solar Energy</SelectItem>
                <SelectItem value="Wind Energy">Wind Energy</SelectItem>
                <SelectItem value="Hydroelectric">Hydroelectric</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select value={filters.paymentMethod} onValueChange={(value) => onFiltersChange({ ...filters, paymentMethod: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="crypto">Cryptocurrency</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Min Amount ($)</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => onFiltersChange({ ...filters, minAmount: e.target.value })}
            />
          </div>

          <div>
            <Label>Max Amount ($)</Label>
            <Input
              type="number"
              placeholder="No limit"
              value={filters.maxAmount}
              onChange={(e) => onFiltersChange({ ...filters, maxAmount: e.target.value })}
            />
          </div>

          <div>
            <Label>Date From</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div>
            <Label>Date To</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onReset}>
            Reset Filters
          </Button>
          <Button>
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EnhancedOrdersTab() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    projectType: 'all',
    paymentMethod: 'all',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: ''
  });

  // Filtered and sorted orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.lotName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Advanced filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }
    if (filters.priority !== 'all') {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }
    if (filters.projectType !== 'all') {
      filtered = filtered.filter(order => order.projectType === filters.projectType);
    }
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === filters.paymentMethod);
    }
    if (filters.minAmount) {
      filtered = filtered.filter(order => order.totalAmount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(order => order.totalAmount <= parseFloat(filters.maxAmount));
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(order => new Date(order.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(order => new Date(order.createdAt) <= new Date(filters.dateTo));
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt' || sortConfig.key === 'deliveryDate') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [orders, searchTerm, filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const paginatedOrders = filteredAndSortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      projectType: 'all',
      paymentMethod: 'all',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const exportOrders = () => {
    // Simulate export functionality
    const dataStr = JSON.stringify(filteredAndSortedOrders, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `orders-export-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  return (
    <PermissionGuard permission={PERMISSIONS.VIEW_ORDER}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Enhanced Orders Management
            </h2>
            <p className="text-gray-600">Advanced order tracking and management</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportOrders}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <PermissionGuard permission={PERMISSIONS.CREATE_ORDER}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders by ID, buyer, seller, or lot name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <AdvancedFilters 
            filters={filters} 
            onFiltersChange={setFilters} 
            onReset={resetFilters}
          />
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{filteredAndSortedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">
                    ${filteredAndSortedOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">
                    {filteredAndSortedOrders.filter(order => order.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">
                    {filteredAndSortedOrders.filter(order => order.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Orders ({paginatedOrders.length} of {filteredAndSortedOrders.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Show:</Label>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      Order ID {getSortIcon('id')}
                    </div>
                  </TableHead>
                  <TableHead>Buyer/Seller</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('quantity')}>
                    <div className="flex items-center gap-1">
                      Quantity {getSortIcon('quantity')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('totalAmount')}>
                    <div className="flex items-center gap-1">
                      Total {getSortIcon('totalAmount')}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1">
                      Created {getSortIcon('createdAt')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-mono text-sm font-medium">{order.id}</div>
                        <PriorityBadge priority={order.priority} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>
                          <div className="font-medium text-sm">{order.buyerName}</div>
                          <div className="text-xs text-gray-500">Buyer</div>
                        </div>
                        <div>
                          <div className="font-medium text-sm">{order.sellerName}</div>
                          <div className="text-xs text-gray-500">Seller</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{order.lotName}</div>
                        <div className="text-xs text-gray-500">{order.lotId}</div>
                        <div className="text-xs text-blue-600">{order.projectType}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.quantity} tons</div>
                        <div className="text-sm text-gray-500">${order.pricePerTon}/ton</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600">${order.totalAmount}</div>
                      <div className="text-xs text-gray-500 capitalize">{order.paymentMethod.replace('_', ' ')}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <PermissionGuard permission={PERMISSIONS.UPDATE_ORDER}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission={PERMISSIONS.DELETE_ORDER}>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedOrders.length)} of {filteredAndSortedOrders.length} orders
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <OrderDetailsDialog 
          order={selectedOrder}
          isOpen={isDetailsDialogOpen}
          onClose={() => {
            setIsDetailsDialogOpen(false);
            setSelectedOrder(null);
          }}
        />
      </div>
    </PermissionGuard>
  );
}