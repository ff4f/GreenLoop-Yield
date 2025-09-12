// Role-based access control system for GreenLoop Yield

// Define user roles
export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator', 
  AUDITOR: 'auditor',
  DEVELOPER: 'developer',
  BUYER: 'buyer',
  GUEST: 'guest'
};

// Define permissions
export const PERMISSIONS = {
  // Lot management
  LOT_CREATE: 'lot:create',
  LOT_UPDATE: 'lot:update',
  LOT_DELETE: 'lot:delete',
  LOT_LIST: 'lot:list',
  LOT_VERIFY: 'lot:verify',
  LOT_APPROVE: 'lot:approve',
  
  // Order management
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  ORDER_VIEW: 'order:view',
  ORDER_DELIVER: 'order:deliver',
  ORDER_SETTLE: 'order:settle',
  
  // Claim management
  CLAIM_CREATE: 'claim:create',
  CLAIM_UPDATE: 'claim:update',
  CLAIM_VERIFY: 'claim:verify',
  CLAIM_APPROVE: 'claim:approve',
  
  // User management
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_VIEW: 'user:view',
  
  // System administration
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_AUDIT: 'system:audit',
  SYSTEM_BACKUP: 'system:backup',
  
  // Financial operations
  FINANCE_ESCROW: 'finance:escrow',
  FINANCE_PAYOUT: 'finance:payout',
  FINANCE_REFUND: 'finance:refund',
  
  // Proof management
  PROOF_CREATE: 'proof:create',
  PROOF_VERIFY: 'proof:verify',
  PROOF_APPROVE: 'proof:approve',
  
  // ProofTray permissions
  PROOF_TRAY_VIEW: 'proof_tray:view',
  PROOF_TRAY_CREATE: 'proof_tray:create',
  PROOF_TRAY_UPDATE: 'proof_tray:update',
  PROOF_TRAY_DELETE: 'proof_tray:delete',
  PROOF_TRAY_VERIFY: 'proof_tray:verify'
};

// Role-permission mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS)
  ],
  
  [USER_ROLES.OPERATOR]: [
    PERMISSIONS.LOT_CREATE,
    PERMISSIONS.LOT_UPDATE,
    PERMISSIONS.LOT_LIST,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_DELIVER,
    PERMISSIONS.CLAIM_CREATE,
    PERMISSIONS.CLAIM_UPDATE,
    PERMISSIONS.PROOF_CREATE,
    PERMISSIONS.PROOF_TRAY_VIEW,
    PERMISSIONS.PROOF_TRAY_CREATE,
    PERMISSIONS.PROOF_TRAY_UPDATE
  ],
  
  [USER_ROLES.AUDITOR]: [
    PERMISSIONS.LOT_LIST,
    PERMISSIONS.LOT_VERIFY,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.CLAIM_VERIFY,
    PERMISSIONS.PROOF_VERIFY,
    PERMISSIONS.SYSTEM_AUDIT,
    PERMISSIONS.PROOF_TRAY_VIEW,
    PERMISSIONS.PROOF_TRAY_VERIFY
  ],
  
  [USER_ROLES.DEVELOPER]: [
    PERMISSIONS.LOT_CREATE,
    PERMISSIONS.LOT_UPDATE,
    PERMISSIONS.LOT_LIST,
    PERMISSIONS.CLAIM_CREATE,
    PERMISSIONS.PROOF_CREATE,
    PERMISSIONS.PROOF_TRAY_VIEW,
    PERMISSIONS.PROOF_TRAY_CREATE
  ],
  
  [USER_ROLES.BUYER]: [
    PERMISSIONS.LOT_LIST,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.PROOF_TRAY_VIEW
  ],
  
  [USER_ROLES.GUEST]: [
    PERMISSIONS.LOT_LIST
  ]
};

// Get permissions for a role
export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if user has permission
export function hasPermission(userRole, permission) {
  if (!userRole || !permission) return false;
  
  const permissions = getPermissionsForRole(userRole);
  return permissions.includes(permission);
}

// Check if user can access resource
export function canAccess(userRole, requiredPermission) {
  return hasPermission(userRole, requiredPermission);
}

// Guard functions for specific operations
export const Guards = {
  // Lot operations
  canCreateLot: (userRole) => canAccess(userRole, PERMISSIONS.LOT_CREATE),
  canUpdateLot: (userRole) => canAccess(userRole, PERMISSIONS.LOT_UPDATE),
  canDeleteLot: (userRole) => canAccess(userRole, PERMISSIONS.LOT_DELETE),
  canVerifyLot: (userRole) => canAccess(userRole, PERMISSIONS.LOT_VERIFY),
  canApproveLot: (userRole) => canAccess(userRole, PERMISSIONS.LOT_APPROVE),
  
  // Order operations
  canCreateOrder: (userRole) => canAccess(userRole, PERMISSIONS.ORDER_CREATE),
  canUpdateOrder: (userRole) => canAccess(userRole, PERMISSIONS.ORDER_UPDATE),
  canDeleteOrder: (userRole) => canAccess(userRole, PERMISSIONS.ORDER_DELETE),
  canDeliverOrder: (userRole) => canAccess(userRole, PERMISSIONS.ORDER_DELIVER),
  canSettleOrder: (userRole) => canAccess(userRole, PERMISSIONS.ORDER_SETTLE),
  
  // Claim operations
  canCreateClaim: (userRole) => canAccess(userRole, PERMISSIONS.CLAIM_CREATE),
  canUpdateClaim: (userRole) => canAccess(userRole, PERMISSIONS.CLAIM_UPDATE),
  canVerifyClaim: (userRole) => canAccess(userRole, PERMISSIONS.CLAIM_VERIFY),
  canApproveClaim: (userRole) => canAccess(userRole, PERMISSIONS.CLAIM_APPROVE),
  
  // User operations
  canManageUsers: (userRole) => canAccess(userRole, PERMISSIONS.USER_CREATE),
  canViewUsers: (userRole) => canAccess(userRole, PERMISSIONS.USER_VIEW),
  
  // System operations
  canConfigureSystem: (userRole) => canAccess(userRole, PERMISSIONS.SYSTEM_CONFIG),
  canAuditSystem: (userRole) => canAccess(userRole, PERMISSIONS.SYSTEM_AUDIT),
  
  // Financial operations
  canManageEscrow: (userRole) => canAccess(userRole, PERMISSIONS.FINANCE_ESCROW),
  canProcessPayout: (userRole) => canAccess(userRole, PERMISSIONS.FINANCE_PAYOUT),
  canProcessRefund: (userRole) => canAccess(userRole, PERMISSIONS.FINANCE_REFUND),
  
  // Proof operations
  canCreateProof: (userRole) => canAccess(userRole, PERMISSIONS.PROOF_CREATE),
  canVerifyProof: (userRole) => canAccess(userRole, PERMISSIONS.PROOF_VERIFY),
  canApproveProof: (userRole) => canAccess(userRole, PERMISSIONS.PROOF_APPROVE)
};

// Status-based guards
export const StatusGuards = {
  // Lot status guards
  canTransitionLotStatus: (userRole, fromStatus, toStatus) => {
    const transitions = {
      'draft': ['pending_verification'],
      'pending_verification': ['verified', 'cancelled'],
      'verified': ['listed', 'cancelled'],
      'listed': ['partially_sold', 'sold_out', 'expired'],
      'partially_sold': ['sold_out', 'expired'],
      'sold_out': ['retired'],
      'retired': [],
      'cancelled': [],
      'expired': ['listed']
    };
    
    const allowedTransitions = transitions[fromStatus] || [];
    if (!allowedTransitions.includes(toStatus)) return false;
    
    // Check role permissions for specific transitions
    if (toStatus === 'verified' && !Guards.canVerifyLot(userRole)) return false;
    if (toStatus === 'listed' && !Guards.canApproveLot(userRole)) return false;
    
    return true;
  },
  
  // Order status guards
  canTransitionOrderStatus: (userRole, fromStatus, toStatus) => {
    const transitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['escrow', 'failed'],
      'escrow': ['completed', 'disputed'],
      'completed': [],
      'cancelled': [],
      'failed': ['pending'],
      'refunded': [],
      'disputed': ['completed', 'refunded']
    };
    
    const allowedTransitions = transitions[fromStatus] || [];
    if (!allowedTransitions.includes(toStatus)) return false;
    
    // Check role permissions for specific transitions
    if (toStatus === 'completed' && !Guards.canDeliverOrder(userRole)) return false;
    if (toStatus === 'refunded' && !Guards.canProcessRefund(userRole)) return false;
    
    return true;
  }
};

// Resource ownership guards
export const OwnershipGuards = {
  canAccessOwnResource: (userRole, userId, resourceOwnerId) => {
    // Admin can access any resource
    if (userRole === USER_ROLES.ADMIN) return true;
    
    // Users can access their own resources
    return userId === resourceOwnerId;
  },
  
  canModifyOwnResource: (userRole, userId, resourceOwnerId) => {
    // Admin can modify any resource
    if (userRole === USER_ROLES.ADMIN) return true;
    
    // Operators can modify resources in their domain
    if (userRole === USER_ROLES.OPERATOR) return true;
    
    // Users can modify their own resources
    return userId === resourceOwnerId;
  }
};

// Error messages for access denied
export const ACCESS_DENIED_MESSAGES = {
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
  INVALID_ROLE: 'Invalid user role',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  RESOURCE_ACCESS_DENIED: 'Access denied to this resource',
  OPERATION_NOT_ALLOWED: 'Operation not allowed for current user'
};

// Helper function to get access denied reason
export function getAccessDeniedReason(userRole, permission, context = {}) {
  if (!userRole) return ACCESS_DENIED_MESSAGES.INVALID_ROLE;
  if (!hasPermission(userRole, permission)) return ACCESS_DENIED_MESSAGES.INSUFFICIENT_PERMISSIONS;
  
  // Additional context-specific checks can be added here
  if (context.statusTransition && !context.statusTransition.allowed) {
    return ACCESS_DENIED_MESSAGES.INVALID_STATUS_TRANSITION;
  }
  
  return ACCESS_DENIED_MESSAGES.OPERATION_NOT_ALLOWED;
}

export default {
  USER_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  Guards,
  StatusGuards,
  OwnershipGuards,
  hasPermission,
  canAccess,
  getPermissionsForRole,
  getAccessDeniedReason,
  ACCESS_DENIED_MESSAGES
};