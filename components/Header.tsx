'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onResetLayout?: () => void;
  onResetAllPanels?: () => void;
  showLayoutControls?: boolean;
}

export default function Header({ onResetLayout, onResetAllPanels, showLayoutControls = false }: HeaderProps) {
  const pathname = usePathname();
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { user, logout, isPageVisible } = useAuth();
  
  return (
    <header className="gradient-bg text-white shadow-lg">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-robot text-xl"></i>
            <Link href="/" className="text-lg font-bold hover:text-opacity-80">
              Report Content Writer
            </Link>
            <span className="bg-white text-purple-600 px-2 py-1 rounded-full text-xs font-semibold">
              LLAMA AI
            </span>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                pathname === '/dashboard' 
                  ? 'bg-white bg-opacity-30' 
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
            >
              <i className="fas fa-tachometer-alt mr-1"></i>
              Dashboard
            </Link>
            {user && isPageVisible('reports') && (
              <Link
                href="/report-writer"
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  pathname === '/report-writer' 
                    ? 'bg-white bg-opacity-30' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                <i className="fas fa-edit mr-1"></i>
                Report Writer
              </Link>
            )}
            {user && isPageVisible('chat') && (
              <Link
                href="/file-ai"
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  pathname?.startsWith('/file-ai') 
                    ? 'bg-white bg-opacity-30' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                <i className="fas fa-file-upload mr-1"></i>
                File AI
              </Link>
            )}
            {user && isPageVisible('chat') && (
              <Link
                href="/excel-converter"
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  pathname?.startsWith('/excel-converter') 
                    ? 'bg-white bg-opacity-30' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                <i className="fas fa-file-excel mr-1"></i>
                Excel Converter
              </Link>
            )}
            {user && isPageVisible('reports') && (
              <Link
                href="/report-titles"
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  pathname?.startsWith('/report-titles') || pathname?.startsWith('/report-toc')
                    ? 'bg-white bg-opacity-30' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                <i className="fas fa-list-alt mr-1"></i>
                Title Tracker
              </Link>
            )}
          </nav>
          
          <div className="flex items-center space-x-2">
            {/* Layout Controls (only show on report writer pages) */}
            {showLayoutControls && (
              <div className="relative">
                <button
                  onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm transition-all flex items-center"
                  title="Layout Controls"
                >
                  <i className="fas fa-th-large mr-1"></i>
                  Layout
                  <i className={`fas fa-chevron-${showLayoutDropdown ? 'up' : 'down'} ml-1 text-xs`}></i>
                </button>

                {/* Layout Dropdown */}
                {showLayoutDropdown && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-1">
                      Layout Controls
                    </div>
                    
                    <button
                      onClick={() => {
                        onResetAllPanels?.();
                        setShowLayoutDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-undo mr-2 text-blue-500"></i>
                      Reset All Panels
                      <span className="ml-auto text-xs text-gray-500">Ctrl+Shift+R</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        onResetLayout?.();
                        setShowLayoutDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-expand-arrows-alt mr-2 text-green-500"></i>
                      Reset to Wide Layout
                    </button>
                    
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <div className="px-3 py-1 text-xs text-gray-500">
                        <i className="fas fa-info-circle mr-1"></i>
                        Panel sizes and positions
                      </div>
                    </div>
                  </div>
                )}

                {/* Backdrop to close dropdown */}
                {showLayoutDropdown && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLayoutDropdown(false)}
                  />
                )}
              </div>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm transition-all flex items-center"
                  title="User Menu"
                >
                  <i className="fas fa-user mr-1"></i>
                  {user.username}
                  <i className={`fas fa-chevron-${showUserDropdown ? 'up' : 'down'} ml-1 text-xs`}></i>
                </button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-48">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-1">
                      {user.role.name}
                    </div>
                    
                    <div className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>

                    {user && isPageVisible('users') && (
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <i className="fas fa-users mr-2 text-blue-500"></i>
                        Manage Users
                      </button>
                    )}

                    {user && isPageVisible('prompts') && (
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <i className="fas fa-cog mr-2 text-gray-500"></i>
                        Settings
                      </button>
                    )}
                    
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={async () => {
                          await logout();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <i className="fas fa-sign-out-alt mr-2 text-red-500"></i>
                        Logout
                      </button>
                    </div>
                  </div>
                )}

                {/* Backdrop to close dropdown */}
                {showUserDropdown && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm transition-all">
                  <i className="fas fa-sign-in-alt mr-1"></i>
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
