'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import LoginForm from '@/components/LoginForm';

export default function HomePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !isAuthLoading) {
      router.push('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  // Show loading state while auth is initializing
  if (isAuthLoading) {
    return (
      <div className="bg-gray-100 h-screen flex flex-col">
        <Header showLayoutControls={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="bg-gray-100 h-screen flex flex-col">
        <Header showLayoutControls={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <i className="fas fa-robot text-4xl text-purple-600 mb-2"></i>
                <h1 className="text-2xl font-bold text-gray-800">Report Content Writer</h1>
                <p className="text-gray-600">LLAMA AI - Please sign in to continue</p>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This will rarely be shown as user gets redirected to dashboard
  return (
    <div className="bg-gray-100 h-screen flex flex-col">
      <Header showLayoutControls={false} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  );
}
