'use client';

import Header from '@/components/Header';
import ExcelConverter from '@/components/ExcelConverter';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ExcelConverterPage() {
  return (
    <ProtectedRoute requiredPermission="chat">
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto py-8">
          <ExcelConverter />
        </main>
      </div>
    </ProtectedRoute>
  );
}
