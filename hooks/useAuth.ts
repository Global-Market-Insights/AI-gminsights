import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, LoginCredentials, PagePermission } from '@/types/auth';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  checkPermission: (page: keyof User['role']['permissions']) => PagePermission;
  hasWriteAccess: (page: keyof User['role']['permissions']) => boolean;
  hasReadAccess: (page: keyof User['role']['permissions']) => boolean;
  isPageVisible: (page: keyof User['role']['permissions']) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        return true;
      } else {
        console.error('Login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  }, []);

  // Permission checking functions
  const checkPermission = useCallback((page: keyof User['role']['permissions']): PagePermission => {
    if (!user || !user.role || !user.role.permissions) {
      return 'invisible';
    }
    return user.role.permissions[page] || 'invisible';
  }, [user]);

  const hasWriteAccess = useCallback((page: keyof User['role']['permissions']): boolean => {
    return checkPermission(page) === 'write';
  }, [checkPermission]);

  const hasReadAccess = useCallback((page: keyof User['role']['permissions']): boolean => {
    const permission = checkPermission(page);
    return permission === 'read' || permission === 'write';
  }, [checkPermission]);

  const isPageVisible = useCallback((page: keyof User['role']['permissions']): boolean => {
    return checkPermission(page) !== 'invisible';
  }, [checkPermission]);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkPermission,
    hasWriteAccess,
    hasReadAccess,
    isPageVisible,
  };
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
