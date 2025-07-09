export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // In production, this should be hashed
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: RolePermissions;
}

export interface RolePermissions {
  reports: PagePermission;
  toc: PagePermission;
  chat: PagePermission;
  prompts: PagePermission;
  users?: PagePermission; // Admin only
}

export type PagePermission = 'invisible' | 'read' | 'write';

export interface AuthSession {
  user: Omit<User, 'password'>;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  token?: string;
  message?: string;
}
