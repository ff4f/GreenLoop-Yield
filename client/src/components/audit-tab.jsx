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
import { 
  Shield, 
  Eye, 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  User, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Database, 
  Lock, 
  Unlock, 
  Edit, 
  Trash2, 
  Plus, 
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Hash,
  Globe
} from 'lucide-react';
import { useAuth, PermissionGuard } from './wallet-guard';
import { PERMISSIONS } from '../../../shared/guards';

// Mock audit log data
const mockAuditLogs = [
  {
    id: 'audit-001',
    timestamp: '2024-01-25T14:30:00Z',
    userId: 'user-001',
    userName: 'John Kamau',
    userRole: 'farmer',
    action: 'CREATE_LOT',
    resource: 'lot',
    resourceId: 'lot-001',
    resourceName: 'Kenya Reforestation Q1',
    description: 'Created new carbon credit lot',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'success',
    changes: {
      before: null,
      after: {
        totalTons: 100,
        pricePerTon: 25,
        status: 'draft'
      }
    },
    metadata: {
      sessionId: 'sess-123',
      requestId: 'req-456',
      transactionHash: null,
      blockNumber: null
    },
    severity: 'info',
    category: 'data_modification'
  },
  {
    id: 'audit-002',
    timestamp: '2024-01-25T15:45:00Z',
    userId: 'user-002',
    userName: 'Admin User',
    userRole: 'admin',
    action: 'VERIFY_LOT',
    resource: 'lot',
    resourceId: 'lot-001',
    resourceName: 'Kenya Reforestation Q1',
    description: 'Verified carbon credit lot for marketplace listing',
    ipAddress: '10.0.0.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'success',
    changes: {
      before: { status: 'pending_verification' },
      after: { status: 'verified', verifiedAt: '2024-01-25T15:45:00Z' }
    },
    metadata: {
      sessionId: 'sess-789',
      requestId: 'req-012',
      transactionHash: '0xabcd1234...',
      blockNumber: 12345
    },
    severity: 'info',
    category: 'verification'
  },
  {
    id: 'audit-003',
    timestamp: '2024-01-25T16:20:00Z',
    userId: 'user-003',
    userName: 'Green Corp',
    userRole: 'buyer',
    action: 'CREATE_ORDER',
    resource: 'order',
    resourceId: 'order-001',
    resourceName: 'Purchase Order #001',
    description: 'Created purchase order for 25 tons of carbon credits',
    ipAddress: '203.0.113.10',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    status: 'success',
    changes: {
      before: null,
      after: {
        quantity: 25,
        totalAmount: 625,
        status: 'pending'
      }
    },
    metadata: {
      sessionId: 'sess-345',
      requestId: 'req-678',
      transactionHash: '0xefgh5678...',
      blockNumber: 12346
    },
    severity: 'info',
    category: 'transaction'
  },
  {
    id: 'audit-004',
    timestamp: '2024-01-25T17:10:00Z',
    userId: 'system',
    userName: 'System',
    userRole: 'system',
    action: 'FAILED_LOGIN',
    resource: 'authentication',
    resourceId: 'auth-attempt-001',
    resourceName: 'Login Attempt',
    description: 'Failed login attempt detected',
    ipAddress: '198.51.100.25',
    userAgent: 'curl/7.68.0',
    status: 'failed',
    changes: {
      before: null,
      after: null
    },
    metadata: {
      sessionId: null,
      requestId: 'req-999',
      transactionHash: null,
      blockNumber: null,
      failureReason: 'Invalid credentials'
    },
    severity: 'warning',
    category: 'security'
  },
  {
    id: 'audit-005',
    timestamp: '2024-01-25T18:00:00Z',
    userId: 'user-004',
    userName: 'Operator User',
    userRole: 'operator',
    action: 'DELETE_LOT',
    resource: 'lot',
    resourceId: 'lot-999',
    resourceName: 'Test Lot (Deleted)',
    description: 'Deleted test lot from system',
    ipAddress: '172.16.0.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    status: 'success',
    changes: {
      before: {
        totalTons: 10,
        pricePerTon: 20,
        status: 'draft'
      },
      after: null
    },
    metadata: {
      sessionId: 'sess-111',
      requestId: 'req-222',
      transactionHash: null,
      blockNumber: null,
      reason: 'Test data cleanup'
    },
    severity: 'warning',
    category: 'data_modification'
  },
  {
    id: 'audit-006',
    timestamp: '2024-01-25T10:30:00Z',
    userId: 'user-003',
    userName: 'Green Corp',
    userRole: 'buyer',
    action: 'RAISE_DISPUTE',
    resource: 'order',
    resourceId: 'order-001',
    resourceName: 'Purchase Order #001',
    description: 'Raised dispute: Quality does not match description',
    ipAddress: '203.0.113.10',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    status: 'success',
    changes: {
      before: { status: 'completed' },
      after: { status: 'disputed', disputeReason: 'Quality does not match description' }
    },
    metadata: {
      sessionId: 'sess-456',
      requestId: 'req-789',
      transactionHash: '0xdispute123...',
      blockNumber: 12350,
      disputeId: 'dispute-001'
    },
    severity: 'warning',
    category: 'dispute'
  },
  {
    id: 'audit-007',
    timestamp: '2024-01-22T16:30:00Z',
    userId: 'user-002',
    userName: 'Admin User',
    userRole: 'admin',
    action: 'RESOLVE_DISPUTE',
    resource: 'order',
    resourceId: 'order-002',
    resourceName: 'Purchase Order #002',
    description: 'Resolved dispute in favor of settlement',
    ipAddress: '10.0.0.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'success',
    changes: {
      before: { status: 'disputed' },
      after: { status: 'completed', resolution: 'settle', resolvedAt: '2024-01-22T16:30:00Z' }
    },
    metadata: {
      sessionId: 'sess-789',
      requestId: 'req-101',
      transactionHash: '0xresolve456...',
      blockNumber: 12348,
      disputeId: 'dispute-002',
      resolutionType: 'settle'
    },
    severity: 'info',
    category: 'dispute'
  }
];

const actionColors = {
  CREATE_LOT: 'bg-green-100 text-green-800',
  UPDATE_LOT: 'bg-blue-100 text-blue-800',
  DELETE_LOT: 'bg-red-100 text-red-800',
  VERIFY_LOT: 'bg-purple-100 text-purple-800',
  CREATE_ORDER: 'bg-indigo-100 text-indigo-800',
  UPDATE_ORDER: 'bg-blue-100 text-blue-800',
  DELETE_ORDER: 'bg-red-100 text-red-800',
  RAISE_DISPUTE: 'bg-orange-100 text-orange-800',
  RESOLVE_DISPUTE: 'bg-emerald-100 text-emerald-800',
  LOGIN: 'bg-gray-100 text-gray-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  FAILED_LOGIN: 'bg-red-100 text-red-800',
  PERMISSION_DENIED: 'bg-orange-100 text-orange-800'
};

const statusColors = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800'
};

const severityColors = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900'
};

const categoryColors = {
  data_modification: 'bg-blue-100 text-blue-800',
  verification: 'bg-purple-100 text-purple-800',
  transaction: 'bg-green-100 text-green-800',
  dispute: 'bg-orange-100 text-orange-800',
  security: 'bg-red-100 text-red-800',
  authentication: 'bg-gray-100 text-gray-800',
  system: 'bg-indigo-100 text-indigo-800'
};

function StatusBadge({ status }) {
  return (
    <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
      {status.toUpperCase()}
    </Badge>
  );
}

function ActionBadge({ action }) {
  return (
    <Badge className={actionColors[action] || 'bg-gray-100 text-gray-800'}>
      {action.replace('_', ' ')}
    </Badge>
  );
}

function SeverityBadge({ severity }) {
  const icons = {
    info: <CheckCircle className="h-3 w-3" />,
    warning: <AlertTriangle className="h-3 w-3" />,
    error: <XCircle className="h-3 w-3" />,
    critical: <XCircle className="h-3 w-3" />
  };

  return (
    <Badge className={`${severityColors[severity] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
      {icons[severity]}
      {severity.toUpperCase()}
    </Badge>
  );
}

function CategoryBadge({ category }) {
  return (
    <Badge variant="outline" className={categoryColors[category] || 'bg-gray-100 text-gray-800'}>
      {category.replace('_', ' ').toUpperCase()}
    </Badge>
  );
}

function AuditLogDetailsDialog({ log, isOpen, onClose }) {
  if (!log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Log Details - {log.id}
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
                <Label className="text-sm font-medium text-gray-600">Log ID</Label>
                <p className="font-mono text-sm">{log.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Timestamp</Label>
                <p>{new Date(log.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Action</Label>
                <ActionBadge action={log.action} />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <StatusBadge status={log.status} />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Severity</Label>
                <SeverityBadge severity={log.severity} />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Category</Label>
                <CategoryBadge category={log.category} />
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">User ID</Label>
                <p className="font-mono text-sm">{log.userId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">User Name</Label>
                <p className="font-medium">{log.userName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Role</Label>
                <Badge variant="secondary">{log.userRole}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">IP Address</Label>
                <p className="font-mono text-sm">{log.ipAddress}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">User Agent</Label>
                <p className="text-sm text-gray-700 break-all">{log.userAgent}</p>
              </div>
            </CardContent>
          </Card>

          {/* Resource Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resource Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Resource Type</Label>
                <p className="capitalize">{log.resource}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Resource ID</Label>
                <p className="font-mono text-sm">{log.resourceId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Resource Name</Label>
                <p className="font-medium">{log.resourceName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-sm text-gray-700">{log.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Session ID</Label>
                <p className="font-mono text-sm">{log.metadata.sessionId || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Request ID</Label>
                <p className="font-mono text-sm">{log.metadata.requestId || 'N/A'}</p>
              </div>
              {log.metadata.transactionHash && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Transaction Hash</Label>
                  <p className="font-mono text-sm break-all">{log.metadata.transactionHash}</p>
                </div>
              )}
              {log.metadata.blockNumber && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Block Number</Label>
                  <p className="font-mono text-sm">{log.metadata.blockNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Changes */}
          {(log.changes.before || log.changes.after) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Before</Label>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                      {log.changes.before ? JSON.stringify(log.changes.before, null, 2) : 'N/A'}
                    </pre>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">After</Label>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                      {log.changes.after ? JSON.stringify(log.changes.after, null, 2) : 'N/A'}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            View in Blockchain
          </Button>
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
            <Label>Action</Label>
            <Select value={filters.action} onValueChange={(value) => onFiltersChange({ ...filters, action: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE_LOT">Create Lot</SelectItem>
                <SelectItem value="UPDATE_LOT">Update Lot</SelectItem>
                <SelectItem value="DELETE_LOT">Delete Lot</SelectItem>
                <SelectItem value="VERIFY_LOT">Verify Lot</SelectItem>
                <SelectItem value="CREATE_ORDER">Create Order</SelectItem>
                <SelectItem value="UPDATE_ORDER">Update Order</SelectItem>
                <SelectItem value="DELETE_ORDER">Delete Order</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="FAILED_LOGIN">Failed Login</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Severity</Label>
            <Select value={filters.severity} onValueChange={(value) => onFiltersChange({ ...filters, severity: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Category</Label>
            <Select value={filters.category} onValueChange={(value) => onFiltersChange({ ...filters, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="data_modification">Data Modification</SelectItem>
                <SelectItem value="verification">Verification</SelectItem>
                <SelectItem value="transaction">Transaction</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>User Role</Label>
            <Select value={filters.userRole} onValueChange={(value) => onFiltersChange({ ...filters, userRole: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="farmer">Farmer</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Resource Type</Label>
            <Select value={filters.resource} onValueChange={(value) => onFiltersChange({ ...filters, resource: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="lot">Lot</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date From</Label>
            <Input
              type="datetime-local"
              value={filters.dateFrom}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div>
            <Label>Date To</Label>
            <Input
              type="datetime-local"
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

export default function AuditTab() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [hcsEvents, setHcsEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('audit');

  const [filters, setFilters] = useState({
    action: 'all',
    status: 'all',
    severity: 'all',
    category: 'all',
    userRole: 'all',
    resource: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch audit data from API
  const fetchAuditData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch audit logs
      const auditResponse = await fetch('/api/audit?type=audit&limit=100');
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setAuditLogs(auditData.data || []);
      }
      
      // Fetch HCS events
      const hcsResponse = await fetch('/api/audit?type=hcs&limit=100');
      if (hcsResponse.ok) {
        const hcsData = await hcsResponse.json();
        setHcsEvents(hcsData.data || []);
      }
      
    } catch (err) {
      console.error('Error fetching audit data:', err);
      setError('Failed to load audit data');
      // Fallback to mock data
      setAuditLogs(mockAuditLogs);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAuditData();
  }, []);

  // Reset pagination when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Filtered and sorted logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = auditLogs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Advanced filters
    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(log => log.status === filters.status);
    }
    if (filters.severity !== 'all') {
      filtered = filtered.filter(log => log.severity === filters.severity);
    }
    if (filters.category !== 'all') {
      filtered = filtered.filter(log => log.category === filters.category);
    }
    if (filters.userRole !== 'all') {
      filtered = filtered.filter(log => log.userRole === filters.userRole);
    }
    if (filters.resource !== 'all') {
      filtered = filtered.filter(log => log.resource === filters.resource);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo));
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'timestamp') {
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
  }, [auditLogs, searchTerm, filters, sortConfig]);

  // Filtered and sorted HCS events
  const filteredAndSortedHcsEvents = useMemo(() => {
    let filtered = hcsEvents;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event => 
        (event.topic_id && event.topic_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.message && event.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.contents && event.contents.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.sequence_number && event.sequence_number.toString().includes(searchTerm))
      );
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.timestamp || event.consensus_timestamp);
        return eventDate >= new Date(filters.dateFrom);
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.timestamp || event.consensus_timestamp);
        return eventDate <= new Date(filters.dateTo);
      });
    }

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key] || a.consensus_timestamp;
        let bValue = b[sortConfig.key] || b.consensus_timestamp;

        if (sortConfig.key === 'timestamp' || sortConfig.key === 'consensus_timestamp') {
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
  }, [hcsEvents, searchTerm, filters, sortConfig]);

  // Use the new pagination from currentData
  const currentTabData = activeTab === 'audit' ? filteredAndSortedLogs : filteredAndSortedHcsEvents;
  const totalPagesCount = Math.ceil(currentTabData.length / itemsPerPage);
  const paginatedTabData = currentTabData.slice(
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
    await fetchAuditData();
    setRefreshing(false);
  };

  // Export functions
  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportToJSON = (data, filename) => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleExport = (format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const exportData = activeTab === 'audit' ? filteredAndSortedLogs : hcsEvents;
    const filename = `${activeTab}-logs-${timestamp}.${format}`;
    
    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else if (format === 'json') {
      exportToJSON(exportData, filename);
    }
  };

  const resetFilters = () => {
    setFilters({
      action: 'all',
      status: 'all',
      severity: 'all',
      category: 'all',
      userRole: 'all',
      resource: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Calculate stats for current tab
  const statsData = activeTab === 'audit' ? filteredAndSortedLogs : hcsEvents;
  const stats = useMemo(() => {
    const total = statsData.length;
    const success = statsData.filter(log => log.status === 'success').length;
    const failed = statsData.filter(log => log.status === 'failed').length;
    const warning = statsData.filter(log => log.severity === 'warning').length;
    const error = statsData.filter(log => log.severity === 'error').length;
    
    return { total, success, failed, warning, error };
  }, [statsData]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  // Final pagination variables for rendering
  const finalTotalPages = Math.ceil(currentTabData.length / itemsPerPage);
  const finalPaginatedData = currentTabData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <PermissionGuard permission={PERMISSIONS.VIEW_AUDIT_LOGS}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Audit Trail & Logging
            </h2>
            <p className="text-gray-600">Complete audit trail of all system activities</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Select onValueChange={handleExport}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <Download className="h-4 w-4 mr-2 inline" />
                  CSV
                </SelectItem>
                <SelectItem value="json">
                  <Download className="h-4 w-4 mr-2 inline" />
                  JSON
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search audit logs by ID, user, description, or resource..."
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

        {/* Tabs for Audit Logs and HCS Events */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Audit Logs ({auditLogs.length})
            </TabsTrigger>
            <TabsTrigger value="hcs" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              HCS Events ({hcsEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-6">
            {/* Loading and Error States */}
            {loading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading {activeTab === 'audit' ? 'audit logs' : 'HCS events'}...</p>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={fetchAuditData} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {!loading && !error && (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Total Events</p>
                          <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Successful</p>
                          <p className="text-2xl font-bold">{stats.success}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-600">Failed</p>
                          <p className="text-2xl font-bold">{stats.failed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-sm text-gray-600">Warnings</p>
                          <p className="text-2xl font-bold">{stats.warnings}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-600">Errors</p>
                          <p className="text-2xl font-bold">{stats.errors}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Audit Logs Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{activeTab === 'audit' ? 'Audit Logs' : 'HCS Events'} ({finalPaginatedData.length} of {currentTabData.length})</CardTitle>
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
                          <TableHead className="cursor-pointer" onClick={() => handleSort('timestamp')}>
                            <div className="flex items-center gap-1">
                              Timestamp {getSortIcon('timestamp')}
                            </div>
                          </TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Resource</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finalPaginatedData.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {new Date(log.timestamp).toLocaleDateString()}
                                </div>
                                <div className="text-gray-500">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{log.userName}</div>
                                <div className="text-xs text-gray-500">{log.userRole}</div>
                                <div className="text-xs text-gray-400 font-mono">{log.userId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <ActionBadge action={log.action} />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{log.resourceName}</div>
                                <div className="text-xs text-gray-500 capitalize">{log.resource}</div>
                                <div className="text-xs text-gray-400 font-mono">{log.resourceId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={log.status} />
                            </TableCell>
                            <TableCell>
                              <SeverityBadge severity={log.severity} />
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="text-sm text-gray-700 truncate" title={log.description}>
                                  {log.description}
                                </p>
                                <CategoryBadge category={log.category} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLog(log);
                                    setIsDetailsDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {log.metadata.transactionHash && (
                                  <Button variant="ghost" size="sm" title="View on blockchain">
                                    <Hash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {finalTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, currentData.length)} of {currentData.length} {activeTab === 'audit' ? 'logs' : 'events'}
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
                            Page {currentPage} of {finalTotalPages}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCurrentPage(prev => Math.min(finalTotalPages, prev + 1))}
              disabled={currentPage === finalTotalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

           <TabsContent value="hcs" className="space-y-6">
             {loading && (
               <Card>
                 <CardContent className="p-8 text-center">
                   <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                   <p className="text-gray-600">Loading HCS events...</p>
                 </CardContent>
               </Card>
             )}

             {error && (
               <Card>
                 <CardContent className="p-8 text-center">
                   <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                   <p className="text-red-600 mb-4">{error}</p>
                   <Button onClick={fetchAuditData} variant="outline">
                     <RefreshCw className="h-4 w-4 mr-2" />
                     Retry
                   </Button>
                 </CardContent>
               </Card>
             )}

             {!loading && !error && (
               <>
                 {/* HCS Events Summary Stats */}
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                   <Card>
                     <CardContent className="p-4">
                       <div className="flex items-center gap-2">
                         <Database className="h-5 w-5 text-blue-600" />
                         <div>
                           <p className="text-sm text-gray-600">Total Events</p>
                           <p className="text-2xl font-bold">{stats.total}</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                   
                   <Card>
                     <CardContent className="p-4">
                       <div className="flex items-center gap-2">
                         <CheckCircle className="h-5 w-5 text-green-600" />
                         <div>
                           <p className="text-sm text-gray-600">Processed</p>
                           <p className="text-2xl font-bold">{stats.success}</p>
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
                           <p className="text-2xl font-bold">{stats.failed}</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                   
                   <Card>
                     <CardContent className="p-4">
                       <div className="flex items-center gap-2">
                         <Hash className="h-5 w-5 text-purple-600" />
                         <div>
                           <p className="text-sm text-gray-600">Transactions</p>
                           <p className="text-2xl font-bold">{stats.warnings}</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                   
                   <Card>
                     <CardContent className="p-4">
                       <div className="flex items-center gap-2">
                         <Globe className="h-5 w-5 text-indigo-600" />
                         <div>
                           <p className="text-sm text-gray-600">Topics</p>
                           <p className="text-2xl font-bold">{stats.errors}</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </div>

                 {/* HCS Events Timeline */}
                 <Card>
                   <CardHeader>
                     <div className="flex items-center justify-between">
                       <CardTitle>HCS Events Timeline ({finalPaginatedData.length} of {currentTabData.length})</CardTitle>
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
                           <TableHead className="cursor-pointer" onClick={() => handleSort('timestamp')}>
                             <div className="flex items-center gap-1">
                               Timestamp {getSortIcon('timestamp')}
                             </div>
                           </TableHead>
                           <TableHead>Topic ID</TableHead>
                           <TableHead>Sequence</TableHead>
                           <TableHead>Message</TableHead>
                           <TableHead>Consensus</TableHead>
                           <TableHead>Links</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {finalPaginatedData.map((event) => (
                           <TableRow key={event.id || event.sequence_number}>
                             <TableCell>
                               <div className="text-sm">
                                 <div className="font-medium">
                                   {new Date(event.timestamp || event.consensus_timestamp).toLocaleDateString()}
                                 </div>
                                 <div className="text-gray-500">
                                   {new Date(event.timestamp || event.consensus_timestamp).toLocaleTimeString()}
                                 </div>
                               </div>
                             </TableCell>
                             <TableCell>
                               <div className="font-mono text-sm">
                                 {event.topic_id}
                               </div>
                             </TableCell>
                             <TableCell>
                               <div className="font-mono text-sm">
                                 {event.sequence_number}
                               </div>
                             </TableCell>
                             <TableCell>
                               <div className="max-w-xs">
                                 <p className="text-sm text-gray-700 truncate" title={event.message || event.contents}>
                                   {event.message || event.contents || 'No message'}
                                 </p>
                               </div>
                             </TableCell>
                             <TableCell>
                               <div className="font-mono text-xs text-gray-500">
                                 {event.consensus_timestamp}
                               </div>
                             </TableCell>
                             <TableCell>
                               <div className="flex items-center gap-1">
                                 {event.hashscan_link && (
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     onClick={() => window.open(event.hashscan_link, '_blank')}
                                     title="View on HashScan"
                                   >
                                     <ExternalLink className="h-4 w-4" />
                                   </Button>
                                 )}
                                 {event.transaction_link && (
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     onClick={() => window.open(event.transaction_link, '_blank')}
                                     title="View Transaction"
                                   >
                                     <Hash className="h-4 w-4" />
                                   </Button>
                                 )}
                               </div>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>

                     {/* Pagination */}
                     {finalTotalPages > 1 && (
                       <div className="flex items-center justify-between mt-4">
                         <div className="text-sm text-gray-600">
                           Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, currentTabData.length)} of {currentTabData.length} events
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
                             Page {currentPage} of {finalTotalPages}
                           </span>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => setCurrentPage(prev => Math.min(finalTotalPages, prev + 1))}
                             disabled={currentPage === finalTotalPages}
                           >
                             Next
                           </Button>
                         </div>
                       </div>
                     )}
                   </CardContent>
                 </Card>
               </>
             )}
           </TabsContent>
         </Tabs>

        {/* Audit Log Details Dialog */}
        <AuditLogDetailsDialog 
          log={selectedLog}
          isOpen={isDetailsDialogOpen}
          onClose={() => {
            setIsDetailsDialogOpen(false);
            setSelectedLog(null);
          }}
        />
      </div>
    </PermissionGuard>
  );
}