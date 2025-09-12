const { requireAuth, requirePermission } = require('./middleware/auth-guard');
const { Guards, PERMISSIONS } = require('../shared/guards');

// Mock database untuk proof documents
let proofs = [
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
    fileName: 'carbon-cert-001.pdf',
    fileSize: 2457600,
    fileType: 'application/pdf',
    mimeType: 'application/pdf',
    description: 'Official carbon credit certificate for reforestation project',
    tags: ['carbon', 'certificate', 'verified'],
    metadata: {
      issuer: 'Green Standards Authority',
      validUntil: '2025-01-15',
      creditAmount: '1000 tCO2e',
      projectId: 'GS-VCS-001',
      standard: 'Verified Carbon Standard'
    },
    hash: 'sha256:a1b2c3d4e5f6...',
    ipfsHash: 'QmX1Y2Z3...',
    blockchainTxId: '0x123abc...',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
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
    fileName: 'land-ownership-002.pdf',
    fileSize: 1887436,
    fileType: 'application/pdf',
    mimeType: 'application/pdf',
    description: 'Legal document proving land ownership for agricultural project',
    tags: ['legal', 'ownership', 'pending'],
    metadata: {
      area: '50 hectares',
      location: 'Nairobi, Kenya',
      registrationNumber: 'LR-2024-001',
      issuedBy: 'Ministry of Lands'
    },
    hash: 'sha256:b2c3d4e5f6g7...',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-14T09:15:00Z'
  }
];

// Helper functions
function generateId() {
  return `proof-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function validateProofData(data) {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!data.type || !['certificate', 'legal', 'report', 'invoice', 'photo'].includes(data.type)) {
    errors.push('Valid type is required');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  return errors;
}

module.exports = async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Proofs API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/proofs - Get all proofs with filtering
async function handleGet(req, res) {
  await requireAuth(req, res);
  
  const {
    search,
    status,
    type,
    lotId,
    orderId,
    uploadedBy,
    page = '1',
    limit = '20',
    sortBy = 'uploadedAt',
    sortOrder = 'desc'
  } = req.query;

  let filteredProofs = [...proofs];

  // Apply filters
  if (search) {
    const searchTerm = search.toString().toLowerCase();
    filteredProofs = filteredProofs.filter(proof => 
      proof.title.toLowerCase().includes(searchTerm) ||
      proof.description.toLowerCase().includes(searchTerm) ||
      proof.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  if (status) {
    filteredProofs = filteredProofs.filter(proof => proof.status === status);
  }

  if (type) {
    filteredProofs = filteredProofs.filter(proof => proof.type === type);
  }

  if (lotId) {
    filteredProofs = filteredProofs.filter(proof => proof.lotId === lotId);
  }

  if (orderId) {
    filteredProofs = filteredProofs.filter(proof => proof.orderId === orderId);
  }

  if (uploadedBy) {
    filteredProofs = filteredProofs.filter(proof => proof.uploadedBy === uploadedBy);
  }

  // Apply sorting
  filteredProofs.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;
    
    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });

  // Apply pagination
  const pageNum = parseInt(page.toString());
  const limitNum = parseInt(limit.toString());
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedProofs = filteredProofs.slice(startIndex, endIndex);

  // Format file sizes for display
  const formattedProofs = paginatedProofs.map(proof => ({
    ...proof,
    fileSizeFormatted: formatFileSize(proof.fileSize)
  }));

  return res.status(200).json({
    proofs: formattedProofs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: filteredProofs.length,
      totalPages: Math.ceil(filteredProofs.length / limitNum)
    },
    stats: {
      total: proofs.length,
      pending: proofs.filter(p => p.status === 'pending').length,
      verified: proofs.filter(p => p.status === 'verified').length,
      rejected: proofs.filter(p => p.status === 'rejected').length,
      expired: proofs.filter(p => p.status === 'expired').length
    }
  });
}

// POST /api/proofs - Create new proof
async function handlePost(req, res) {
  await requireAuth(req, res);
  await requirePermission(req, res, PERMISSIONS.CREATE_PROOF);

  const validationErrors = validateProofData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  const {
    title,
    type,
    description,
    tags = [],
    lotId,
    orderId,
    metadata = {},
    fileUrl,
    fileName,
    fileSize,
    fileType,
    mimeType
  } = req.body;

  const newProof = {
    id: generateId(),
    title: title.trim(),
    type,
    status: 'pending',
    description: description.trim(),
    tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
    lotId: lotId || null,
    orderId: orderId || null,
    metadata,
    uploadedBy: req.user?.email || 'unknown@example.com',
    uploadedAt: new Date().toISOString(),
    fileUrl: fileUrl || `/documents/${fileName}`,
    fileName,
    fileSize: parseInt(fileSize) || 0,
    fileType,
    mimeType,
    hash: `sha256:${Math.random().toString(36)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  proofs.unshift(newProof);

  return res.status(201).json({
    message: 'Proof uploaded successfully',
    proof: {
      ...newProof,
      fileSizeFormatted: formatFileSize(newProof.fileSize)
    }
  });
}

// PUT /api/proofs - Update proof (verify, reject, edit)
async function handlePut(req, res) {
  await requireAuth(req, res);
  
  const { id } = req.query;
  const { action, ...updateData } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Proof ID is required' });
  }

  const proofIndex = proofs.findIndex(proof => proof.id === id);
  if (proofIndex === -1) {
    return res.status(404).json({ error: 'Proof not found' });
  }

  const proof = proofs[proofIndex];

  // Handle different actions
  switch (action) {
    case 'verify':
      await requirePermission(req, res, PERMISSIONS.VERIFY_PROOF);
      
      if (proof.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending proofs can be verified' });
      }

      proofs[proofIndex] = {
        ...proof,
        status: 'verified',
        verifiedBy: req.user?.email || 'unknown@example.com',
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      break;

    case 'reject':
      await requirePermission(req, res, PERMISSIONS.VERIFY_PROOF);
      
      if (proof.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending proofs can be rejected' });
      }

      if (!updateData.rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      proofs[proofIndex] = {
        ...proof,
        status: 'rejected',
        rejectedBy: req.user?.email || 'unknown@example.com',
        rejectedAt: new Date().toISOString(),
        rejectionReason: updateData.rejectionReason,
        updatedAt: new Date().toISOString()
      };
      break;

    case 'edit':
      await requirePermission(req, res, PERMISSIONS.UPDATE_PROOF);
      
      // Validate ownership or admin permission
      if (proof.uploadedBy !== req.user?.email && !Guards.hasPermission(req.user, PERMISSIONS.ADMIN_ACCESS)) {
        return res.status(403).json({ error: 'You can only edit your own proofs' });
      }

      const validationErrors = validateProofData(updateData);
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Validation failed', details: validationErrors });
      }

      proofs[proofIndex] = {
        ...proof,
        ...updateData,
        tags: Array.isArray(updateData.tags) ? updateData.tags : updateData.tags?.split(',').map(tag => tag.trim()) || proof.tags,
        updatedAt: new Date().toISOString()
      };
      break;

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(200).json({
    message: `Proof ${action}ed successfully`,
    proof: {
      ...proofs[proofIndex],
      fileSizeFormatted: formatFileSize(proofs[proofIndex].fileSize)
    }
  });
}

// DELETE /api/proofs - Delete proof
async function handleDelete(req, res) {
  await requireAuth(req, res);
  await requirePermission(req, res, PERMISSIONS.DELETE_PROOF);

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Proof ID is required' });
  }

  const proofIndex = proofs.findIndex(proof => proof.id === id);
  if (proofIndex === -1) {
    return res.status(404).json({ error: 'Proof not found' });
  }

  const proof = proofs[proofIndex];

  // Check ownership or admin permission
  if (proof.uploadedBy !== req.user?.email && !Guards.hasPermission(req.user, PERMISSIONS.ADMIN_ACCESS)) {
    return res.status(403).json({ error: 'You can only delete your own proofs' });
  }

  // Remove proof from array
  proofs.splice(proofIndex, 1);

  return res.status(200).json({
    message: 'Proof deleted successfully'
  });
}

// Export helper functions for testing
module.exports.validateProofData = validateProofData;
module.exports.formatFileSize = formatFileSize;
module.exports.generateId = generateId;