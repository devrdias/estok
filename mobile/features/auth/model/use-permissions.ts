import { useMemo } from 'react';
import { useAuth } from './auth-context';

/**
 * Count-related permissions (SDD §2.6).
 * Mock: all true when user is present. Replace with API or role-based check when backend is available.
 */
export interface CountPermissions {
  canDeleteCount: boolean;
  canFinalizeCount: boolean;
  canCreateCount: boolean;
  canContinueCount: boolean;
  canVerifyCount: boolean;
}

export function usePermissions(): CountPermissions {
  const { user } = useAuth();

  return useMemo((): CountPermissions => {
    if (!user) {
      return {
        canDeleteCount: false,
        canFinalizeCount: false,
        canCreateCount: false,
        canContinueCount: false,
        canVerifyCount: false,
      };
    }
    // Mock: all permissions granted. Later: check user.role or call permissions API.
    return {
      canDeleteCount: true,
      canFinalizeCount: true,
      canCreateCount: true,
      canContinueCount: true,
      canVerifyCount: true,
    };
  }, [user]);
}
