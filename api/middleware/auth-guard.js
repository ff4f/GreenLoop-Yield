import { Guards, StatusGuards, OwnershipGuards, USER_ROLES, getAccessDeniedReason } from '../../shared/guards.js';

// Mock user session - in real app this would come from JWT/session
let currentUser = {
  id: 'user-123',
  role: USER_ROLES.DEVELOPER,
  accountId: '0.0.123456'
};

// Set current user (for testing/demo purposes)
export function setCurrentUser(user) {
  currentUser = { ...currentUser, ...user };
}

// Get current user
export function getCurrentUser() {
  return currentUser;
}

// Authentication middleware
export function authenticate(req, res, next) {
  try {
    // In real app, extract user from JWT token
    // For demo, we'll use the mock user
    req.user = currentUser;
    
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid authentication',
      code: 'AUTH_INVALID'
    });
  }
}

// Authorization middleware factory
export function authorize(permission) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (!Guards.hasPermission || !Guards.hasPermission(req.user.role, permission)) {
        const reason = getAccessDeniedReason(req.user.role, permission);
        return res.status(403).json({
          error: reason,
          code: 'ACCESS_DENIED',
          requiredPermission: permission,
          userRole: req.user.role
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Authorization check failed',
        code: 'AUTH_ERROR'
      });
    }
  };
}

// Role-based authorization middleware
export function requireRole(...roles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient role permissions',
          code: 'ROLE_DENIED',
          requiredRoles: roles,
          userRole: req.user.role
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Role check failed',
        code: 'ROLE_ERROR'
      });
    }
  };
}

// Resource ownership middleware
export function requireOwnership(resourceIdParam = 'id', ownerField = 'developerId') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      // Admin can access any resource
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }
      
      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({
          error: 'Resource ID required',
          code: 'RESOURCE_ID_REQUIRED'
        });
      }
      
      // In real app, you would fetch the resource from database
      // For demo, we'll assume ownership check passes
      // const resource = await getResourceById(resourceId);
      // if (!OwnershipGuards.canAccessOwnResource(req.user.role, req.user.id, resource[ownerField])) {
      //   return res.status(403).json({
      //     error: 'Access denied to this resource',
      //     code: 'RESOURCE_ACCESS_DENIED'
      //   });
      // }
      
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Ownership check failed',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
}

// Status transition guard middleware
export function guardStatusTransition(entityType = 'lot') {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const { status: newStatus } = req.body;
      const currentStatus = req.currentResource?.status; // Assume this is set by previous middleware
      
      if (!newStatus || !currentStatus) {
        return next(); // Skip if no status transition
      }
      
      let canTransition = false;
      
      if (entityType === 'lot') {
        canTransition = StatusGuards.canTransitionLotStatus(req.user.role, currentStatus, newStatus);
      } else if (entityType === 'order') {
        canTransition = StatusGuards.canTransitionOrderStatus(req.user.role, currentStatus, newStatus);
      }
      
      if (!canTransition) {
        return res.status(403).json({
          error: `Cannot transition ${entityType} from ${currentStatus} to ${newStatus}`,
          code: 'INVALID_STATUS_TRANSITION',
          currentStatus,
          requestedStatus: newStatus,
          userRole: req.user.role
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Status transition check failed',
        code: 'STATUS_TRANSITION_ERROR'
      });
    }
  };
}

// Specific guard functions for common operations
export const LotGuards = {
  canCreate: authorize('lot:create'),
  canUpdate: authorize('lot:update'),
  canDelete: authorize('lot:delete'),
  canVerify: authorize('lot:verify'),
  canApprove: authorize('lot:approve'),
  requireOwnership: requireOwnership('lotId', 'developerId'),
  guardStatusTransition: guardStatusTransition('lot')
};

export const OrderGuards = {
  canCreate: authorize('order:create'),
  canUpdate: authorize('order:update'),
  canDelete: authorize('order:delete'),
  canDeliver: authorize('order:deliver'),
  canSettle: authorize('order:settle'),
  requireOwnership: requireOwnership('orderId', 'buyerId'),
  guardStatusTransition: guardStatusTransition('order')
};

export const ClaimGuards = {
  canCreate: authorize('claim:create'),
  canUpdate: authorize('claim:update'),
  canVerify: authorize('claim:verify'),
  canApprove: authorize('claim:approve'),
  requireOwnership: requireOwnership('claimId', 'developerId')
};

export const UserGuards = {
  canCreate: authorize('user:create'),
  canUpdate: authorize('user:update'),
  canDelete: authorize('user:delete'),
  canView: authorize('user:view'),
  requireAdmin: requireRole(USER_ROLES.ADMIN)
};

export const SystemGuards = {
  canConfigure: authorize('system:config'),
  canAudit: authorize('system:audit'),
  canBackup: authorize('system:backup'),
  requireAdmin: requireRole(USER_ROLES.ADMIN)
};

// Helper function to check permissions in route handlers
export function checkPermission(userRole, permission) {
  return Guards.hasPermission && Guards.hasPermission(userRole, permission);
}

// Helper function to get user permissions
export function getUserPermissions(userRole) {
  return Guards.getPermissionsForRole ? Guards.getPermissionsForRole(userRole) : [];
}

export default {
  authenticate,
  authorize,
  requireRole,
  requireOwnership,
  guardStatusTransition,
  LotGuards,
  OrderGuards,
  ClaimGuards,
  UserGuards,
  SystemGuards,
  checkPermission,
  getUserPermissions,
  setCurrentUser,
  getCurrentUser
};