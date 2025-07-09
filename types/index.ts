export interface ReportData {
  id?: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  marketName: string;
  baseYear: number;
  forecastYear: number;
  cagr: string;
  marketSize: string;
  marketSizeForecast?: string;
  category: string;
  targetAudience: string;
  reportLength: string;
  // Report Summary sections
  reportSummary?: {
    marketSize?: string;
    marketShare?: string;
    marketAnalysis?: string;
    marketTrends?: string;
    marketPlayers?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedReport {
  id: string;
  title: string;
  slug: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ReportTitle {
  id: string;
  title: string;
  description?: string;
  status: 'created' | 'in-progress' | 'review' | 'published';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  category: string;
  deadline: string; // ISO date string
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  estimatedPages?: number;
  clientName?: string;
  notes?: string;
}

export interface ReportTitleFormData {
  title: string;
  description?: string;
  status: 'created' | 'in-progress' | 'review' | 'published';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  category: string;
  deadline: string;
  tags?: string[];
  estimatedPages?: number;
  clientName?: string;
  notes?: string;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number; // 1 for main sections, 2 for subsections, etc.
  pageNumber?: number;
  order: number;
  parentId?: string; // For nested sections
}

export interface ReportTableOfContents {
  reportId: string;
  reportSlug: string;
  items: TableOfContentsItem[];
  createdAt: string;
  updatedAt: string;
}

// Auth types
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
