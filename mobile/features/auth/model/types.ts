/**
 * User roles for authorization management.
 * - admin: full access to all features and settings
 * - manager: can manage counts (create, delete, finalize, verify) and change all settings
 * - employee: can create and continue counts, but cannot delete, finalize, or verify
 */
const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

/**
 * Auth domain types. Real Google user will replace MockUser when integrated.
 */
interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  photoUrl?: string | null;
  role: UserRoleValue;
}

export { UserRole };
export type { UserRoleValue, AuthUser };
