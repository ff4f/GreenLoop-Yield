// Mock auth guard for development
export const requireAuth = (req, res, next) => {
  // Skip auth in development
  if (next) next();
  return true;
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    // Skip permission check in development
    if (next) next();
    return true;
  };
};

export const requireRole = (role) => {
  return (req, res, next) => {
    // Skip role check in development
    if (next) next();
    return true;
  };
};

// Default export for compatibility
export default {
  requireAuth,
  requirePermission,
  requireRole
};