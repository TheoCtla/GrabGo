export type UserRole = 'STUDENT' | 'MERCHANT' | 'ADMIN';

export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthenticatedUser;
};
