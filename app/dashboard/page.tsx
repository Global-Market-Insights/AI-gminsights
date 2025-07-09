'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface DashboardStats {
  totalReports: number;
  activeReports: number;
  completedReports: number;
  totalFiles: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'report' | 'file' | 'login' | 'toc';
  action: string;
  title: string;
  timestamp: string;
  user?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    activeReports: 0,
    completedReports: 0,
    totalFiles: 0,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load reports stats
      const reportsResponse = await fetch('/api/reports');
      const reportsData = await reportsResponse.json();
      
      // Load report titles stats
      const titlesResponse = await fetch('/api/report-titles');
      const titlesData = await titlesResponse.json();
      
      // Load file storage stats (if accessible)
      let filesCount = 0;
      try {
        const filesResponse = await fetch('/api/storage/list');
        const filesData = await filesResponse.json();
        filesCount = filesData.files?.length || 0;
      } catch (error) {
        console.log('Files not accessible or not found');
      }

      // Calculate stats
      const totalReports = reportsData.reports?.length || 0;
      const activeReports = titlesData.titles?.filter((t: any) => 
        t.status === 'in-progress' || t.status === 'created'
      ).length || 0;
      const completedReports = titlesData.titles?.filter((t: any) => 
        t.status === 'published'
      ).length || 0;

      // Generate recent activity
      const recentActivity = generateRecentActivity(reportsData.reports, titlesData.titles);

      setStats({
        totalReports,
        activeReports,
        completedReports,
        totalFiles: filesCount,
        recentActivity
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecentActivity = (reports: any[] = [], titles: any[] = []): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Add recent reports
    reports.slice(0, 3).forEach((report) => {
      activities.push({
        id: `report-${report.id}`,
        type: 'report',
        action: 'created',
        title: report.title,
        timestamp: report.createdAt || new Date().toISOString(),
        user: user?.username
      });
    });

    // Add recent titles
    titles.slice(0, 3).forEach((title) => {
      activities.push({
        id: `title-${title.id}`,
        type: 'report',
        action: title.status === 'created' ? 'created' : 'updated',
        title: title.title,
        timestamp: title.updatedAt || title.createdAt || new Date().toISOString(),
        user: title.assignedTo || user?.username
      });
    });

    // Sort by timestamp (most recent first)
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string, action: string) => {
    if (type === 'report') return 'fas fa-file-alt';
    if (type === 'file') return 'fas fa-file-upload';
    if (type === 'toc') return 'fas fa-list-alt';
    return 'fas fa-clock';
  };

  return (
    <ProtectedRoute>
      <div className="bg-gray-100 min-h-screen">
        <Header />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {getGreeting()}, {user?.username}!
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome to your LLAMA AI Report Writer dashboard
              </p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <i className="fas fa-user-tag mr-2"></i>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  {user?.role.name}
                </span>
                <span className="mx-2">•</span>
                <i className="fas fa-clock mr-1"></i>
                Last login: {user?.lastLogin ? formatDate(user.lastLogin) : 'First time'}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <i className="fas fa-file-alt text-blue-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : stats.totalReports}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <i className="fas fa-clock text-yellow-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Reports</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : stats.activeReports}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <i className="fas fa-check-circle text-green-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : stats.completedReports}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <i className="fas fa-file-upload text-purple-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Files Processed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : stats.totalFiles}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      href="/report-writer"
                      className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-all group"
                    >
                      <div className="p-2 bg-purple-600 rounded-lg group-hover:bg-purple-700 transition-colors">
                        <i className="fas fa-edit text-white"></i>
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">New Report</p>
                        <p className="text-sm text-gray-600">Start writing with AI</p>
                      </div>
                      <i className="fas fa-arrow-right ml-auto text-purple-600 group-hover:translate-x-1 transition-transform"></i>
                    </Link>

                    {user && user.role.permissions.reports === 'write' && (
                      <Link
                        href="/report-titles/new"
                        className="flex items-center p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg hover:from-green-100 hover:to-teal-100 transition-all group"
                      >
                        <div className="p-2 bg-green-600 rounded-lg group-hover:bg-green-700 transition-colors">
                          <i className="fas fa-plus text-white"></i>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">New Title</p>
                          <p className="text-sm text-gray-600">Create report title</p>
                        </div>
                        <i className="fas fa-arrow-right ml-auto text-green-600 group-hover:translate-x-1 transition-transform"></i>
                      </Link>
                    )}

                    {user && user.role.permissions.chat === 'write' && (
                      <Link
                        href="/file-ai"
                        className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all group"
                      >
                        <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                          <i className="fas fa-file-upload text-white"></i>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">Analyze File</p>
                          <p className="text-sm text-gray-600">Upload & process</p>
                        </div>
                        <i className="fas fa-arrow-right ml-auto text-blue-600 group-hover:translate-x-1 transition-transform"></i>
                      </Link>
                    )}

                    {user && user.role.permissions.chat === 'write' && (
                      <Link
                        href="/excel-converter"
                        className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg hover:from-orange-100 hover:to-red-100 transition-all group"
                      >
                        <div className="p-2 bg-orange-600 rounded-lg group-hover:bg-orange-700 transition-colors">
                          <i className="fas fa-file-excel text-white"></i>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">Convert Excel</p>
                          <p className="text-sm text-gray-600">Transform data</p>
                        </div>
                        <i className="fas fa-arrow-right ml-auto text-orange-600 group-hover:translate-x-1 transition-transform"></i>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    <Link
                      href="/report-titles"
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      View all →
                    </Link>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex items-center p-3 border border-gray-100 rounded-lg">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div className="ml-3 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : stats.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <i className={`${getActivityIcon(activity.type, activity.action)} text-gray-600`}></i>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="font-medium text-gray-900 truncate">
                              {activity.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {activity.action} by {activity.user || 'Unknown'} • {formatDate(activity.timestamp)}
                            </p>
                          </div>
                          <div className="text-xs text-gray-400">
                            <i className={`fas fa-${activity.type === 'report' ? 'file-alt' : 'file'}`}></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-clock text-4xl mb-3 text-gray-300"></i>
                      <p>No recent activity</p>
                      <p className="text-sm">Start creating reports to see activity here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="font-medium text-gray-600 mb-1">Application Version</p>
                  <p className="text-gray-900">LLAMA AI v1.0.0</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 mb-1">Your Role</p>
                  <p className="text-gray-900">{user?.role.name}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 mb-1">Session Status</p>
                  <p className="text-green-600">
                    <i className="fas fa-circle text-xs mr-1"></i>
                    Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
