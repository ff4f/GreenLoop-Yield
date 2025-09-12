import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { PermissionGuard } from './wallet-guard';
import { PERMISSIONS } from '../../../shared/guards';
import {
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Share2,
  Shield,
  Calendar,
  User,
  Tag
} from 'lucide-react';

// Mock data untuk proof documents
const mockProofs = [
  {
    id: 'proof-001',
    title: 'Carbon Credit Certificate',
    type: 'certificate',
    status: 'verified',
    lotId: 'lot-001',
    orderId: 'order-001',
    uploadedBy: 'farmer@example.com',
    uploadedAt: '2024-01-15T10:30:00Z',
    verifiedBy: 'verifier@example.com',
    verifiedAt: '2024-01-16T14:20:00Z',
    fileUrl: '/documents/carbon-cert-001.pdf',
    fileSize: '2.4 MB',
    fileType: 'PDF',
    description: 'Official carbon credit certificate for reforestation project',
    tags: ['carbon', 'certificate', 'verified'],
    metadata: {
      issuer: 'Green Standards Authority',
      validUntil: '2025-01-15',
      creditAmount: '1000 tCO2e'
    }
  },
  {
    id: 'proof-002',
    title: 'Land Ownership Document',
    type: 'legal',
    status: 'pending',
    lotId: 'lot-002',
    uploadedBy: 'farmer2@example.com',
    uploadedAt: '2024-01-14T09:15:00Z',
    fileUrl: '/documents/land-ownership-002.pdf',
    fileSize: '1.8 MB',
    fileType: 'PDF',
    description: 'Legal document proving land ownership for agricultural project',
    tags: ['legal', 'ownership', 'pending'],
    metadata: {
      area: '50 hectares',
      location: 'Nairobi, Kenya'
    }
  },
  {
    id: 'proof-003',
    title: 'Sustainability Report',
    type: 'report',
    status: 'rejected',
    lotId: 'lot-001',
    uploadedBy: 'operator@example.com',
    uploadedAt: '2024-01-13T16:45:00Z',
    rejectedBy: 'auditor@example.com',
    rejectedAt: '2024-01-14T11:30:00Z',
    rejectionReason: 'Missing environmental impact assessment data',
    fileUrl: '/documents/sustainability-report-003.pdf',
    fileSize: '5.2 MB',
    fileType: 'PDF',
    description: 'Annual sustainability report for agricultural operations',
    tags: ['sustainability', 'report', 'rejected'],
    metadata: {
      reportPeriod: '2023',
      scope: 'Full operations'
    }
  }
];

const PROOF_TYPES = {
  certificate: { label: 'Certificate', icon: Shield, color: 'bg-green-100 text-green-800' },
  legal: { label: 'Legal Document', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  report: { label: 'Report', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  invoice: { label: 'Invoice', icon: FileText, color: 'bg-orange-100 text-orange-800' },
  photo: { label: 'Photo Evidence', icon: Eye, color: 'bg-pink-100 text-pink-800' }
};

const PROOF_STATUS = {
  pending: { label: 'Pending Review', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  verified: { label: 'Verified', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired', icon: AlertTriangle, color: 'bg-gray-100 text-gray-800' }
};

export default function ProofTray() {
  const [proofs, setProofs] = useState(mockProofs);
  const [filteredProofs, setFilteredProofs] = useState(mockProofs);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedProof, setSelectedProof] = useState(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: '',
    description: '',
    tags: '',
    lotId: '',
    orderId: ''
  });

  // Filter proofs based on search and filters
  useEffect(() => {
    let filtered = proofs;

    if (searchTerm) {
      filtered = filtered.filter(proof => 
        proof.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(proof => proof.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(proof => proof.type === typeFilter);
    }

    setFilteredProofs(filtered);
  }, [proofs, searchTerm, statusFilter, typeFilter]);

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    const newProof = {
      id: `proof-${Date.now()}`,
      ...uploadForm,
      status: 'pending',
      uploadedBy: 'current-user@example.com',
      uploadedAt: new Date().toISOString(),
      fileUrl: '/documents/uploaded-file.pdf',
      fileSize: '1.2 MB',
      fileType: 'PDF',
      tags: uploadForm.tags.split(',').map(tag => tag.trim()),
      metadata: {}
    };
    
    setProofs([newProof, ...proofs]);
    setUploadForm({ title: '', type: '', description: '', tags: '', lotId: '', orderId: '' });
    setIsUploadDialogOpen(false);
  };

  const handleVerifyProof = (proofId) => {
    setProofs(proofs.map(proof => 
      proof.id === proofId 
        ? { 
            ...proof, 
            status: 'verified',
            verifiedBy: 'current-user@example.com',
            verifiedAt: new Date().toISOString()
          }
        : proof
    ));
  };

  const handleRejectProof = (proofId, reason) => {
    setProofs(proofs.map(proof => 
      proof.id === proofId 
        ? { 
            ...proof, 
            status: 'rejected',
            rejectedBy: 'current-user@example.com',
            rejectedAt: new Date().toISOString(),
            rejectionReason: reason
          }
        : proof
    ));
  };

  const ProofCard = ({ proof }) => {
    const TypeIcon = PROOF_TYPES[proof.type]?.icon || FileText;
    const StatusIcon = PROOF_STATUS[proof.status]?.icon || Clock;

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => { setSelectedProof(proof); setIsDetailDialogOpen(true); }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TypeIcon className="h-5 w-5 text-gray-600" />
              <h3 className="font-medium text-sm">{proof.title}</h3>
            </div>
            <Badge className={PROOF_STATUS[proof.status]?.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {PROOF_STATUS[proof.status]?.label}
            </Badge>
          </div>
          
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{proof.description}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{proof.fileType} • {proof.fileSize}</span>
            <span>{new Date(proof.uploadedAt).toLocaleDateString()}</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {proof.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {proof.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">+{proof.tags.length - 3}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProofDetailDialog = () => {
    if (!selectedProof) return null;

    const TypeIcon = PROOF_TYPES[selectedProof.type]?.icon || FileText;
    const StatusIcon = PROOF_STATUS[selectedProof.status]?.icon || Clock;

    return (
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <TypeIcon className="h-5 w-5" />
              <span>{selectedProof.title}</span>
              <Badge className={PROOF_STATUS[selectedProof.status]?.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {PROOF_STATUS[selectedProof.status]?.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm">{PROOF_TYPES[selectedProof.type]?.label}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">File Info</label>
                  <p className="text-sm">{selectedProof.fileType} • {selectedProof.fileSize}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Uploaded By</label>
                  <p className="text-sm">{selectedProof.uploadedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Upload Date</label>
                  <p className="text-sm">{new Date(selectedProof.uploadedAt).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm mt-1">{selectedProof.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedProof.tags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
              
              {selectedProof.status === 'verified' && selectedProof.verifiedBy && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-green-700">Verified By</label>
                    <p className="text-sm">{selectedProof.verifiedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">Verified Date</label>
                    <p className="text-sm">{new Date(selectedProof.verifiedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {selectedProof.status === 'rejected' && selectedProof.rejectionReason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <label className="text-sm font-medium text-red-700">Rejection Reason</label>
                  <p className="text-sm mt-1">{selectedProof.rejectionReason}</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="text-sm font-medium text-red-700">Rejected By</label>
                      <p className="text-sm">{selectedProof.rejectedBy}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-red-700">Rejected Date</label>
                      <p className="text-sm">{new Date(selectedProof.rejectedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="metadata" className="space-y-4">
              {Object.entries(selectedProof.metadata || {}).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <p className="text-sm">{value}</p>
                </div>
              ))}
              {Object.keys(selectedProof.metadata || {}).length === 0 && (
                <p className="text-sm text-gray-500">No metadata available</p>
              )}
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="flex items-center space-x-1">
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
                <Button size="sm" variant="outline" className="flex items-center space-x-1">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
                <PermissionGuard permission={PERMISSIONS.UPDATE_PROOF}>
                  <Button size="sm" variant="outline" className="flex items-center space-x-1">
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                </PermissionGuard>
              </div>
              
              {selectedProof.status === 'pending' && (
                <PermissionGuard permission={PERMISSIONS.VERIFY_PROOF}>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleVerifyProof(selectedProof.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Proof
                    </Button>
                    <Button 
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) handleRejectProof(selectedProof.id, reason);
                      }}
                      variant="destructive" 
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Proof
                    </Button>
                  </div>
                </PermissionGuard>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Proof Tray</h2>
          <p className="text-gray-600">Manage and verify proof documents</p>
        </div>
        <PermissionGuard permission={PERMISSIONS.CREATE_PROOF}>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Upload Proof</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Proof</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                    placeholder="Enter proof title"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={uploadForm.type} onValueChange={(value) => setUploadForm({...uploadForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select proof type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROOF_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tags (comma-separated)</label>
                  <Input 
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
                    placeholder="e.g. carbon, certificate, verified"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Lot ID (optional)</label>
                    <Input 
                      value={uploadForm.lotId}
                      onChange={(e) => setUploadForm({...uploadForm, lotId: e.target.value})}
                      placeholder="lot-001"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Order ID (optional)</label>
                    <Input 
                      value={uploadForm.orderId}
                      onChange={(e) => setUploadForm({...uploadForm, orderId: e.target.value})}
                      placeholder="order-001"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Proofs</p>
                <p className="text-2xl font-bold">{proofs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pending Review</p>
                <p className="text-2xl font-bold">{proofs.filter(p => p.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Verified</p>
                <p className="text-2xl font-bold">{proofs.filter(p => p.status === 'verified').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold">{proofs.filter(p => p.status === 'rejected').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search proofs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(PROOF_STATUS).map(([key, status]) => (
                  <SelectItem key={key} value={key}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(PROOF_TYPES).map(([key, type]) => (
                  <SelectItem key={key} value={key}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Proofs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProofs.map(proof => (
          <ProofCard key={proof.id} proof={proof} />
        ))}
      </div>

      {filteredProofs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proofs found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <ProofDetailDialog />
    </div>
  );
}