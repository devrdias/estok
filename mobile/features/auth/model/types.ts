/**
 * Auth domain types. Real Google user will replace MockUser when integrated.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  photoUrl?: string | null;
}
