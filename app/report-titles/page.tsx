'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ReportTitle } from '@/types';

export default function ReportTitlesPage() {
  const [titles, setTitles] = useState<ReportTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  });

  const statusColors = {
    'created': 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'review': 'bg-yellow-100 text-yellow-800',
    'published': 'bg-green-100 text-green-800'
  };

  const priorityColors = {
    'low': 'bg-green-50 border-green-200',
    'medium': 'bg-yellow-50 border-yellow-200',
    'high': 'bg-orange-50 border-orange-200',
    'urgent': 'bg-red-50 border-red-200'
  };

  const fetchTitles = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);
      if (filter.priority) params.append('priority', filter.priority);

      const response = await fetch(`/api/report-titles?${params}`);
      const data = await response.json();

      if (data.success) {
        let filteredTitles = data.titles;
        
        // Apply search filter
        if (filter.search) {
          filteredTitles = filteredTitles.filter((title: ReportTitle) =>
            title.title.toLowerCase().includes(filter.search.toLowerCase()) ||
            title.description?.toLowerCase().includes(filter.search.toLowerCase()) ||
            title.assignedTo?.toLowerCase().includes(filter.search.toLowerCase())
          );
        }
        
        setTitles(filteredTitles);
      }
    } catch (error) {
      console.error('Error fetching titles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles();
  }, [filter]);

  const deleteTitle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report title?')) return;

    try {
      const response = await fetch(`/api/report-titles/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTitles(titles.filter(title => title.id !== id));
      }
    } catch (error) {
      console.error('Error deleting title:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return '📝';
      case 'in-progress': return '⚙️';
      case 'review': return '👀';
      case 'published': return '✅';
      default: return '📝';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'urgent': return '🔴';
      default: return '🟢';
    }
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <ProtectedRoute requiredPermission="reports">
      <div className="bg-gray-100 min-h-screen">
        <Header />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Report Title Tracker</h1>
                <p className="text-gray-600 mt-1">Manage and track all your report titles and their progress</p>
              </div>
            <Link
              href="/report-titles/new"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Add New Title
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  placeholder="Search titles..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="created">Created</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filter.priority}
                  onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="Technology">Technology</option>
                  <option value="Automotive & Transportation">Automotive & Transportation</option>
                  <option value="Energy & Environment">Energy & Environment</option>
                  <option value="Healthcare & Pharmaceuticals">Healthcare & Pharmaceuticals</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Consumer Goods">Consumer Goods</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Real Estate">Real Estate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Titles List */}
          {isLoading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
              <p className="text-gray-500 mt-2">Loading report titles...</p>
            </div>
          ) : titles.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">No report titles found. Create your first one!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {titles.map((title) => (
                <div
                  key={title.id}
                  className={`bg-white rounded-lg shadow p-4 border-l-4 hover:shadow-md transition-shadow ${
                    priorityColors[title.priority]
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">{getPriorityIcon(title.priority)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{title.title}</h3>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${statusColors[title.status]}`}>
                          {getStatusIcon(title.status)} {title.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      {title.description && (
                        <p className="text-gray-600 mb-2">{title.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span><i className="fas fa-tag mr-1"></i>{title.category}</span>
                        {title.assignedTo && (
                          <span><i className="fas fa-user mr-1"></i>{title.assignedTo}</span>
                        )}
                        {title.estimatedPages && (
                          <span><i className="fas fa-file-alt mr-1"></i>{title.estimatedPages} pages</span>
                        )}
                        {title.clientName && (
                          <span><i className="fas fa-building mr-1"></i>{title.clientName}</span>
                        )}
                        <span>
                          <i className={`fas fa-calendar mr-1 ${isOverdue(title.deadline) ? 'text-red-500' : ''}`}></i>
                          {new Date(title.deadline).toLocaleDateString()}
                          {isOverdue(title.deadline) ? (
                            <span className="text-red-500 font-medium ml-1">(Overdue)</span>
                          ) : (
                            <span className={`ml-1 ${getDaysUntilDeadline(title.deadline) <= 3 ? 'text-orange-500' : ''}`}>
                              ({getDaysUntilDeadline(title.deadline)} days)
                            </span>
                          )}
                        </span>
                      </div>
                      
                      {title.tags && title.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {title.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Link
                        href={`/report-titles/${title.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button
                        onClick={() => deleteTitle(title.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
