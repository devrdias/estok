import { useMemo } from 'react';
import { useAuth } from './auth-context';
import { UserRole } from './types';
import type { UserRoleValue } from './types';

/**
 * Count-related permissions derived from the user's role.
 *
 * | Permission       | admin | manager | employee |
 * |------------------|-------|---------|----------|
 * | canCreateCount   |  yes  |   yes   |   yes    |
 * | canContinueCount |  yes  |   yes   |   yes    |
 * | canDeleteCount   |  yes  |   yes   |    no    |
 * | canFinalizeCount |  yes  |   yes   |    no    |
 * | canVerifyCount   |  yes  |   yes   |    no    |
 */
export interface CountPermissions {
  canDeleteCount: boolean;
  canFinalizeCount: boolean;
  canCreateCount: boolean;
  canContinueCount: boolean;
  canVerifyCount: boolean;
}

/**
 * App-level permissions derived from the user's role.
 *
 * | Permission           | admin | manager | employee |
 * |----------------------|-------|---------|----------|
 * | canAccessSettings    |  yes  |   yes   |   yes    |
 * | canChangeBlindCount  |  yes  |   yes   |    no    |
 * | canManageUsers       |  yes  |    no   |    no    |
 */
export interface AppPermissions {
  canAccessSettings: boolean;
  canChangeBlindCount: boolean;
  canManageUsers: boolean;
}

/** Combined permissions exposed by usePermissions. */
export interface Permissions extends CountPermissions, AppPermissions {}

const NO_PERMISSIONS: Permissions = {
  canDeleteCount: false,
  canFinalizeCount: false,
  canCreateCount: false,
  canContinueCount: false,
  canVerifyCount: false,
  canAccessSettings: false,
  canChangeBlindCount: false,
  canManageUsers: false,
};

/**
 * Builds the permission set for a given role.
 * Pure function — easy to unit-test independently.
 */
function buildPermissions(role: UserRoleValue): Permissions {
  switch (role) {
    case UserRole.ADMIN:
      return {
        canCreateCount: true,
        canContinueCount: true,
        canDeleteCount: true,
        canFinalizeCount: true,
        canVerifyCount: true,
        canAccessSettings: true,
        canChangeBlindCount: true,
        canManageUsers: true,
      };
    case UserRole.MANAGER:
      return {
        canCreateCount: true,
        canContinueCount: true,
        canDeleteCount: true,
        canFinalizeCount: true,
        canVerifyCount: true,
        canAccessSettings: true,
        canChangeBlindCount: true,
        canManageUsers: false,
      };
    case UserRole.EMPLOYEE:
      return {
        canCreateCount: true,
        canContinueCount: true,
        canDeleteCount: false,
        canFinalizeCount: false,
        canVerifyCount: false,
        canAccessSettings: true,
        canChangeBlindCount: false,
        canManageUsers: false,
      };
    default:
      return NO_PERMISSIONS;
  }
}

/**
 * Hook that returns role-based permissions for the current authenticated user.
 *
 * @example
 * ```tsx
 * const { canDeleteCount, canFinalizeCount } = usePermissions();
 * ```
 */
export function usePermissions(): Permissions {
  const { user } = useAuth();

  return useMemo((): Permissions => {
    if (!user) return NO_PERMISSIONS;
    return buildPermissions(user.role);
  }, [user]);
}
