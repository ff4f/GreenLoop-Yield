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
import { Switch } from './ui/switch';
import { 
  Settings, 
  Users, 
  Shield, 
  Database, 
  Server, 
  Globe, 
  Key, 
  Mail, 
  Bell, 
  Lock, 
  Unlock, 
  UserPlus, 
  UserMinus, 
  Edit, 
  Trash2, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  MoreHorizontal,
  Crown,
  UserCheck,
  UserX,
  Activity,
  Clock,
  MapPin,
  Phone,
  Building
} from 'lucide-react';
import { useAuth, PermissionGuard } from './wallet-guard';
import { PERMISSIONS, USER_ROLES } from '../../../shared/guards';

// Mock users data
const mockUsers = [
  {
    id: 'user-001',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    email: 'john.kamau@example.com',
    name: 'John Kamau',
    role: 'farmer',
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: '2024-01-25T14:20:00Z',
    loginCount: 45,
    country: 'Kenya',
    region: 'Nairobi',
    phone: '+254712345678',
    organization: 'Green Farmers Cooperative',
    kycStatus: 'verified',
    permissions: ['CREATE_LOT', 'UPDATE_LOT', 'VIEW_LOT'],
    metadata: {
      farmSize: '50 hectares',
      cropTypes: ['Coffee', 'Maize'],
      certifications: ['Organic', 'Fair Trade']
    }
  },
  {
    id: 'user-002',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    email: 'admin@greenloop.com',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-25T18:00:00Z',
    loginCount: 120,
    country: 'Kenya',
    region: 'Nairobi',
    phone: '+254700000000',
    organization: 'GreenLoop Platform',
    kycStatus: 'verified',
    permissions: ['ALL'],
    metadata: {
      department: 'Platform Operations',
      accessLevel: 'Super Admin'
    }
  },
  {
    id: 'user-003',
    walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
    email: 'greencorp@example.com',
    name: 'Green Corp',
    role: 'buyer',
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-10T09:15:00Z',
    lastLogin: '2024-01-25T16:45:00Z',
    loginCount: 28,
    country: 'South Africa',
    region: 'Cape Town',
    phone: '+27123456789',
    organization: 'Green Corp Ltd',
    kycStatus: 'verified',
    permissions: ['CREATE_ORDER', 'VIEW_ORDER', 'VIEW_LOT'],
    metadata: {
      companyType: 'Carbon Trading',
      annualVolume: '10000 tons CO2',
      industry: 'Environmental Services'
    }
  },
  {
    id: 'user-004',
    walletAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
    email: 'operator@greenloop.com',
    name: 'Operator User',
    role: 'operator',
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-05T12:00:00Z',
    lastLogin: '2024-01-25T17:30:00Z',
    loginCount: 85,
    country: 'Kenya',
    region: 'Mombasa',
    phone: '+254711111111',
    organization: 'GreenLoop Platform',
    kycStatus: 'verified',
    permissions: ['VERIFY_LOT', 'UPDATE_ORDER', 'VIEW_AUDIT_LOGS'],
    metadata: {
      department: 'Operations',
      specialization: 'Carbon Credit Verification'
    }
  },
  {
    id: 'user-005',
    walletAddress: '0x1111222233334444555566667777888899990000',
    email: 'pending@example.com',
    name: 'Pending User',
    role: 'farmer',
    status: 'pending',
    isVerified: false,
    createdAt: '2024-01-24T08:00:00Z',
    lastLogin: null,
    loginCount: 0,
    country: 'Nigeria',
    region: 'Lagos',
    phone: '+234123456789',
    organization: 'Small Scale Farmers Union',
    kycStatus: 'pending',
    permissions: [],
    metadata: {
      farmSize: '5 hectares',
      cropTypes: ['Cassava', 'Yam'],
      applicationDate: '2024-01-24'
    }
  }
];

// Mock system configuration
const mockSystemConfig = {
  platform: {
    name: 'GreenLoop Yield',
    version: '1.0.0',
    environment: 'production',
    maintenanceMode: false,
    maxUsersPerRole: {
      admin: 5,
      operator: 20,
      farmer: 10000,
      buyer: 1000
    }
  },
  blockchain: {
    network: 'hedera-mainnet',
    nodeUrl: 'https://mainnet-public.mirrornode.hedera.com',
    contractAddress: '0.0.123456',
    gasLimit: 300000,
    confirmationBlocks: 1
  },
  security: {
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: true,
    allowedCountries: ['Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Uganda'],
    kycRequired: true
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    webhookUrl: 'https://api.greenloop.com/webhooks',
    slackWebhook: 'https://hooks.slack.com/services/...',
    emailProvider: 'sendgrid'
  },
  features: {
    carbonCreditTrading: true,
    realTimeVerification: true,
    geoMapping: true,
    auditTrail: true,
    apiAccess: true,
    mobileApp: true
  },
  limits: {
    maxLotSize: 10000,
    minLotSize: 1,
    maxOrderValue: 1000000,
    dailyTransactionLimit: 100,
    apiRateLimit: 1000
  }
};

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  operator: 'bg-blue-100 text-blue-800',
  farmer: 'bg-green-100 text-green-800',
  buyer: 'bg-purple-100 text-purple-800'
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800'
};

const kycStatusColors = {
  verified: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  not_submitted: 'bg-gray-100 text-gray-800'
};

function RoleBadge({ role }) {
  const icons = {
    admin: <Crown className="h-3 w-3" />,
    operator: <UserCheck className="h-3 w-3" />,
    farmer: <Users className="h-3 w-3" />,
    buyer: <Building className="h-3 w-3" />
  };

  return (
    <Badge className={`${roleColors[role] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
      {icons[role]}
      {role.toUpperCase()}
    </Badge>
  );
}

function StatusBadge({ status }) {
  const icons = {
    active: <CheckCircle className="h-3 w-3" />,
    inactive: <XCircle className="h-3 w-3" />,
    suspended: <UserX className="h-3 w-3" />,
    pending: <Clock className="h-3 w-3" />
  };

  return (
    <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
      {icons[status]}
      {status.toUpperCase()}
    </Badge>
  );
}

function KycStatusBadge({ status }) {
  return (
    <Badge className={kycStatusColors[status] || 'bg-gray-100 text-gray-800'}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
}

function UserDetailsDialog({ user, isOpen, onClose, onSave }) {
  const [editedUser, setEditedUser] = useState(user || {});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);

  if (!user) return null;

  const handleSave = () => {
    onSave(editedUser);
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Details - {user.name}
            <div className="flex items-center gap-2 ml-auto">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>User ID</Label>
                    <Input value={editedUser.id} disabled className="font-mono" />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input 
                      value={editedUser.name} 
                      onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      value={editedUser.email} 
                      onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input 
                      value={editedUser.phone} 
                      onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Organization</Label>
                    <Input 
                      value={editedUser.organization} 
                      onChange={(e) => setEditedUser({...editedUser, organization: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Role</Label>
                    <Select 
                      value={editedUser.role} 
                      onValueChange={(value) => setEditedUser({...editedUser, role: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="farmer">Farmer</SelectItem>
                        <SelectItem value="buyer">Buyer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select 
                      value={editedUser.status} 
                      onValueChange={(value) => setEditedUser({...editedUser, status: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>KYC Status</Label>
                    <Select 
                      value={editedUser.kycStatus} 
                      onValueChange={(value) => setEditedUser({...editedUser, kycStatus: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="not_submitted">Not Submitted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={editedUser.isVerified} 
                      onCheckedChange={(checked) => setEditedUser({...editedUser, isVerified: checked})}
                      disabled={!isEditing}
                    />
                    <Label>Email Verified</Label>
                  </div>
                  <div>
                    <Label>Wallet Address</Label>
                    <Input value={editedUser.walletAddress} disabled className="font-mono text-xs" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Country</Label>
                    <Input 
                      value={editedUser.country} 
                      onChange={(e) => setEditedUser({...editedUser, country: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Region</Label>
                    <Input 
                      value={editedUser.region} 
                      onChange={(e) => setEditedUser({...editedUser, region: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Created At</Label>
                    <Input value={new Date(editedUser.createdAt).toLocaleString()} disabled />
                  </div>
                  <div>
                    <Label>Last Login</Label>
                    <Input value={editedUser.lastLogin ? new Date(editedUser.lastLogin).toLocaleString() : 'Never'} disabled />
                  </div>
                  <div>
                    <Label>Login Count</Label>
                    <Input value={editedUser.loginCount} disabled />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.values(PERMISSIONS).map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Switch 
                        checked={editedUser.permissions.includes(permission) || editedUser.permissions.includes('ALL')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditedUser({
                              ...editedUser, 
                              permissions: [...editedUser.permissions, permission]
                            });
                          } else {
                            setEditedUser({
                              ...editedUser, 
                              permissions: editedUser.permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                        disabled={!isEditing || editedUser.permissions.includes('ALL')}
                      />
                      <Label className="text-sm">{permission.replace('_', ' ')}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Last Login</p>
                      <p className="text-xs text-gray-600">{editedUser.lastLogin ? new Date(editedUser.lastLogin).toLocaleString() : 'Never'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Account Created</p>
                      <p className="text-xs text-gray-600">{new Date(editedUser.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <Users className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Total Logins</p>
                      <p className="text-xs text-gray-600">{editedUser.loginCount} times</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(editedUser.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SystemConfigTab({ config, onConfigChange }) {
  const [editedConfig, setEditedConfig] = useState(config);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('platform');

  const handleSave = () => {
    onConfigChange(editedConfig);
    setIsEditing(false);
  };

  const sections = {
    platform: { title: 'Platform Settings', icon: <Settings className="h-4 w-4" /> },
    blockchain: { title: 'Blockchain Configuration', icon: <Database className="h-4 w-4" /> },
    security: { title: 'Security Settings', icon: <Shield className="h-4 w-4" /> },
    notifications: { title: 'Notification Settings', icon: <Bell className="h-4 w-4" /> },
    features: { title: 'Feature Flags', icon: <Activity className="h-4 w-4" /> },
    limits: { title: 'System Limits', icon: <AlertTriangle className="h-4 w-4" /> }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">System Configuration</h3>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Configuration
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Configuration Sections</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {Object.entries(sections).map(([key, section]) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    activeSection === key ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : ''
                  }`}
                >
                  {section.icon}
                  {section.title}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {sections[activeSection].icon}
              {sections[activeSection].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSection === 'platform' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Platform Name</Label>
                  <Input 
                    value={editedConfig.platform.name}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      platform: { ...editedConfig.platform, name: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label>Version</Label>
                  <Input 
                    value={editedConfig.platform.version}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      platform: { ...editedConfig.platform, version: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label>Environment</Label>
                  <Select 
                    value={editedConfig.platform.environment}
                    onValueChange={(value) => setEditedConfig({
                      ...editedConfig,
                      platform: { ...editedConfig.platform, environment: value }
                    })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editedConfig.platform.maintenanceMode}
                    onCheckedChange={(checked) => setEditedConfig({
                      ...editedConfig,
                      platform: { ...editedConfig.platform, maintenanceMode: checked }
                    })}
                    disabled={!isEditing}
                  />
                  <Label>Maintenance Mode</Label>
                </div>
              </div>
            )}

            {activeSection === 'blockchain' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Network</Label>
                  <Select 
                    value={editedConfig.blockchain.network}
                    onValueChange={(value) => setEditedConfig({
                      ...editedConfig,
                      blockchain: { ...editedConfig.blockchain, network: value }
                    })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hedera-mainnet">Hedera Mainnet</SelectItem>
                      <SelectItem value="hedera-testnet">Hedera Testnet</SelectItem>
                      <SelectItem value="hedera-previewnet">Hedera Previewnet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Node URL</Label>
                  <Input 
                    value={editedConfig.blockchain.nodeUrl}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      blockchain: { ...editedConfig.blockchain, nodeUrl: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label>Contract Address</Label>
                  <Input 
                    value={editedConfig.blockchain.contractAddress}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      blockchain: { ...editedConfig.blockchain, contractAddress: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label>Gas Limit</Label>
                  <Input 
                    type="number"
                    value={editedConfig.blockchain.gasLimit}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      blockchain: { ...editedConfig.blockchain, gasLimit: parseInt(e.target.value) }
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Session Timeout (seconds)</Label>
                  <Input 
                    type="number"
                    value={editedConfig.security.sessionTimeout}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      security: { ...editedConfig.security, sessionTimeout: parseInt(e.target.value) }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label>Max Login Attempts</Label>
                  <Input 
                    type="number"
                    value={editedConfig.security.maxLoginAttempts}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      security: { ...editedConfig.security, maxLoginAttempts: parseInt(e.target.value) }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label>Password Min Length</Label>
                  <Input 
                    type="number"
                    value={editedConfig.security.passwordMinLength}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      security: { ...editedConfig.security, passwordMinLength: parseInt(e.target.value) }
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editedConfig.security.requireTwoFactor}
                    onCheckedChange={(checked) => setEditedConfig({
                      ...editedConfig,
                      security: { ...editedConfig.security, requireTwoFactor: checked }
                    })}
                    disabled={!isEditing}
                  />
                  <Label>Require Two-Factor Auth</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editedConfig.security.kycRequired}
                    onCheckedChange={(checked) => setEditedConfig({
                      ...editedConfig,
                      security: { ...editedConfig.security, kycRequired: checked }
                    })}
                    disabled={!isEditing}
                  />
                  <Label>KYC Required</Label>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editedConfig.notifications.emailEnabled}
                    onCheckedChange={(checked) => setEditedConfig({
                      ...editedConfig,
                      notifications: { ...editedConfig.notifications, emailEnabled: checked }
                    })}
                    disabled={!isEditing}
                  />
                  <Label>Email Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editedConfig.notifications.smsEnabled}
                    onCheckedChange={(checked) => setEditedConfig({
                      ...editedConfig,
                      notifications: { ...editedConfig.notifications, smsEnabled: checked }
                    })}
                    disabled={!isEditing}
                  />
                  <Label>SMS Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editedConfig.notifications.pushEnabled}
                    onCheckedChange={(checked) => setEditedConfig({
                      ...editedConfig,
                      notifications: { ...editedConfig.notifications, pushEnabled: checked }
                    })}
                    disabled={!isEditing}
                  />
                  <Label>Push Notifications</Label>
                </div>
                <div>
                  <Label>Email Provider</Label>
                  <Select 
                    value={editedConfig.notifications.emailProvider}
                    onValueChange={(value) => setEditedConfig({
                      ...editedConfig,
                      notifications: { ...editedConfig.notifications, emailProvider: value }
                    })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {activeSection === 'features' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(editedConfig.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Switch 
                      checked={enabled}
                      onCheckedChange={(checked) => setEditedConfig({
                        ...editedConfig,
                        features: { ...editedConfig.features, [feature]: checked }
                      })}
                      disabled={!isEditing}
                    />
                    <Label>{feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'limits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(editedConfig.limits).map(([limit, value]) => (
                  <div key={limit}>
                    <Label>{limit.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                    <Input 
                      type="number"
                      value={value}
                      onChange={(e) => setEditedConfig({
                        ...editedConfig,
                        limits: { ...editedConfig.limits, [limit]: parseInt(e.target.value) }
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [systemConfig, setSystemConfig] = useState(mockSystemConfig);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    kycStatus: 'all'
  });
  const [refreshing, setRefreshing] = useState(false);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }
    if (filters.kycStatus !== 'all') {
      filtered = filtered.filter(user => user.kycStatus === filters.kycStatus);
    }

    return filtered;
  }, [users, searchTerm, filters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleUserSave = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleConfigChange = (newConfig) => {
    setSystemConfig(newConfig);
  };

  // Statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    verifiedUsers: users.filter(u => u.kycStatus === 'verified').length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    operatorUsers: users.filter(u => u.role === 'operator').length,
    farmerUsers: users.filter(u => u.role === 'farmer').length,
    buyerUsers: users.filter(u => u.role === 'buyer').length
  };

  return (
    <PermissionGuard permission={PERMISSIONS.ADMIN_ACCESS}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Admin Panel
            </h2>
            <p className="text-gray-600">User management and system configuration</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Config
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* User Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-xl font-bold">{stats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Active</p>
                      <p className="text-xl font-bold">{stats.activeUsers}</p>
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
                      <p className="text-xl font-bold">{stats.pendingUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Verified</p>
                      <p className="text-xl font-bold">{stats.verifiedUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Admins</p>
                      <p className="text-xl font-bold">{stats.adminUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Operators</p>
                      <p className="text-xl font-bold">{stats.operatorUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Farmers</p>
                      <p className="text-xl font-bold">{stats.farmerUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Buyers</p>
                      <p className="text-xl font-bold">{stats.buyerUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.kycStatus} onValueChange={(value) => setFilters({...filters, kycStatus: value})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All KYC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="not_submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Users ({filteredUsers.length})</CardTitle>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">{user.organization}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={user.status} />
                        </TableCell>
                        <TableCell>
                          <KycStatusBadge status={user.kycStatus} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {user.country}
                            </div>
                            <div className="text-gray-500">{user.region}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.lastLogin ? (
                              <>
                                <div>{new Date(user.lastLogin).toLocaleDateString()}</div>
                                <div className="text-gray-500">{new Date(user.lastLogin).toLocaleTimeString()}</div>
                              </>
                            ) : (
                              <span className="text-gray-400">Never</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsUserDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <SystemConfigTab 
              config={systemConfig} 
              onConfigChange={handleConfigChange}
            />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Platform Status</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Blockchain Connection</span>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Services</span>
                      <Badge className="bg-green-100 text-green-800">Running</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm font-medium">120ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Uptime</span>
                      <span className="text-sm font-medium">99.9%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Sessions</span>
                      <span className="text-sm font-medium">1,234</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily Transactions</span>
                      <span className="text-sm font-medium">5,678</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">High memory usage detected</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Scheduled maintenance in 2 days</span>
                    </div>
                    <div className="text-sm text-gray-500 text-center py-4">
                      No critical alerts
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* User Details Dialog */}
        <UserDetailsDialog 
          user={selectedUser}
          isOpen={isUserDialogOpen}
          onClose={() => {
            setIsUserDialogOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleUserSave}
        />
      </div>
    </PermissionGuard>
  );
}