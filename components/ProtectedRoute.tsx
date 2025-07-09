'use client';

import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/LoginForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof import('@/types/index').User['role']['permissions'];
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission,
  fallback = <div className="p-4 text-center text-gray-500">Access Denied</div>
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isPageVisible } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Check permission if required
  if (requiredPermission && !isPageVisible(requiredPermission)) {
    return fallback;
  }

  return <>{children}</>;
}
