import React, { createContext, useContext, useState, useEffect } from 'react';
import { USER_ROLES, Guards, hasPermission, getPermissionsForRole } from '../../../shared/guards.js';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Lock, Shield, User, AlertTriangle } from 'lucide-react';

// Auth Context
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  switchRole: () => {},
  hasPermission: () => false,
  canAccess: () => false
});

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mock authentication - in real app this would connect to Hedera wallet
  useEffect(() => {
    // Simulate checking for existing session
    const savedUser = localStorage.getItem('greenloop_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('greenloop_user');
      }
    }
  }, []);

  const login = (userData) => {
    const userWithDefaults = {
      id: userData.id || `user-${Date.now()}`,
      accountId: userData.accountId || '0.0.123456',
      role: userData.role || USER_ROLES.BUYER,
      email: userData.email || 'user@example.com',
      name: userData.name || 'Demo User',
      ...userData
    };
    
    setUser(userWithDefaults);
    setIsAuthenticated(true);
    localStorage.setItem('greenloop_user', JSON.stringify(userWithDefaults));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('greenloop_user');
  };

  const switchRole = (newRole) => {
    if (user && Object.values(USER_ROLES).includes(newRole)) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem('greenloop_user', JSON.stringify(updatedUser));
    }
  };

  const checkPermission = (permission) => {
    if (!user || !user.role) return false;
    return hasPermission(user.role, permission);
  };

  const canAccess = (requiredPermission) => {
    return checkPermission(requiredPermission);
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    switchRole,
    hasPermission: checkPermission,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Permission Guard Component
export function PermissionGuard({ 
  permission, 
  children, 
  fallback = null, 
  showAccessDenied = true 
}) {
  const { canAccess, user } = useAuth();

  if (!canAccess(permission)) {
    if (fallback) {
      return fallback;
    }
    
    if (showAccessDenied) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <Lock className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Access Restricted
            </h3>
            <p className="text-red-600 mb-4">
              You don't have permission to access this feature.
            </p>
            <div className="space-y-2 text-sm text-red-700">
              <p><strong>Required Permission:</strong> {permission}</p>
              <p><strong>Your Role:</strong> {user?.role || 'None'}</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  }

  return children;
}

// Role Guard Component
export function RoleGuard({ 
  roles, 
  children, 
  fallback = null, 
  showAccessDenied = true 
}) {
  const { user } = useAuth();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const hasAccess = user && allowedRoles.includes(user.role);

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    
    if (showAccessDenied) {
      return (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-orange-500" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              Role Access Required
            </h3>
            <p className="text-orange-600 mb-4">
              This feature requires a specific role.
            </p>
            <div className="space-y-2 text-sm text-orange-700">
              <p><strong>Required Roles:</strong> {allowedRoles.join(', ')}</p>
              <p><strong>Your Role:</strong> {user?.role || 'None'}</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  }

  return children;
}

// Authentication Guard Component
export function AuthGuard({ children, fallback = null, showLoginPrompt = true }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }
    
    if (showLoginPrompt) {
      return <LoginPrompt />;
    }
    
    return null;
  }

  return children;
}

// Login Prompt Component
function LoginPrompt() {
  const { login } = useAuth();

  const handleDemoLogin = (role) => {
    login({
      id: `demo-${role}-${Date.now()}`,
      accountId: `0.0.${Math.floor(Math.random() * 999999)}`,
      role: role,
      email: `demo-${role}@greenloop.com`,
      name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`
    });
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-6 text-center">
        <User className="mx-auto mb-4 h-12 w-12 text-blue-500" />
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Authentication Required
        </h3>
        <p className="text-blue-600 mb-6">
          Please connect your wallet or login to continue.
        </p>
        
        <div className="space-y-3">
          <p className="text-sm font-medium text-blue-700 mb-3">Demo Login Options:</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(USER_ROLES).map((role) => (
              <Button
                key={role}
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin(role)}
                className="text-xs"
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// User Info Component
export function UserInfo() {
  const { user, logout, switchRole } = useAuth();

  if (!user) return null;

  const userPermissions = getPermissionsForRole(user.role);

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">{user.name}</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {user.role}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm text-green-700">
          <p><strong>Account ID:</strong> {user.accountId}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Permissions:</strong> {userPermissions.length}</p>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <select 
            value={user.role} 
            onChange={(e) => switchRole(e.target.value)}
            className="text-xs px-2 py-1 border rounded"
          >
            {Object.values(USER_ROLES).map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="text-xs"
          >
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Access Denied Component
export function AccessDenied({ 
  title = "Access Denied", 
  message = "You don't have permission to access this resource.",
  requiredPermission = null,
  requiredRole = null 
}) {
  const { user } = useAuth();

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
        <p className="text-red-600 mb-4">{message}</p>
        
        <div className="space-y-2 text-sm text-red-700">
          {requiredPermission && (
            <p><strong>Required Permission:</strong> {requiredPermission}</p>
          )}
          {requiredRole && (
            <p><strong>Required Role:</strong> {requiredRole}</p>
          )}
          <p><strong>Your Role:</strong> {user?.role || 'None'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default {
  AuthProvider,
  useAuth,
  PermissionGuard,
  RoleGuard,
  AuthGuard,
  UserInfo,
  AccessDenied
};