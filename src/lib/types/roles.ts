export type UserRole = 'free' | 'premium' | 'admin';

export interface RolePermissions {
  canAccessPremiumFeatures: boolean;
  canAccessAdminPanel: boolean;
  maxAlerts: number;
  maxCustomIndicators: number;
  maxSavedLayouts: number;
  dataUpdateInterval: number;
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  free: {
    canAccessPremiumFeatures: false,
    canAccessAdminPanel: false,
    maxAlerts: 3,
    maxCustomIndicators: 2,
    maxSavedLayouts: 1,
    dataUpdateInterval: 5000 // 5 seconds
  },
  premium: {
    canAccessPremiumFeatures: true,
    canAccessAdminPanel: false,
    maxAlerts: 20,
    maxCustomIndicators: 10,
    maxSavedLayouts: 5,
    dataUpdateInterval: 1000 // 1 second
  },
  admin: {
    canAccessPremiumFeatures: true,
    canAccessAdminPanel: true,
    maxAlerts: 100,
    maxCustomIndicators: 50,
    maxSavedLayouts: 20,
    dataUpdateInterval: 500 // 500ms
  }
};

export function getRolePermissions(role: UserRole): RolePermissions {
  return rolePermissions[role];
}

export function hasPermission(userRole: UserRole, permission: keyof RolePermissions): boolean {
  return rolePermissions[userRole][permission];
}

export function getMaxValue(userRole: UserRole, limit: keyof RolePermissions): number {
  const value = rolePermissions[userRole][limit];
  return typeof value === 'number' ? value : 0;
}

export function getDataUpdateInterval(userRole: UserRole): number {
  return rolePermissions[userRole].dataUpdateInterval;
}