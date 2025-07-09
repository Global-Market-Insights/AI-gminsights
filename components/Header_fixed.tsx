'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onResetLayout?: () => void;
  onResetAllPanels?: () => void;
  showLayoutControls?: boolean;
}

export default function Header({ onResetLayout, onResetAllPanels, showLayoutControls = false }: HeaderProps) {
  const pathname = usePathname();
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
            {isPageVisible('reports') && (
              <Link
                href="/"
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  pathname === '/' 
                    ? 'bg-white bg-opacity-30' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                <i className="fas fa-home mr-1"></i>
                Report Writer
              </Link>
            )}
            
            {isPageVisible('chat') && (
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
            
            {isPageVisible('toc') && (
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
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm transition-all flex items-center space-x-2"
              >
                <i className="fas fa-user mr-1"></i>
                <span>{user?.username}</span>
                <span className="text-xs bg-white bg-opacity-30 px-2 py-0.5 rounded-full">
                  {user?.role.name}
                </span>
                <i className="fas fa-chevron-down text-xs"></i>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-blue-600 mt-1">{user?.role.name}</p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-sign-out-alt mr-2 text-red-500"></i>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Backdrop to close user menu */}
              {showUserMenu && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
              )}
            </div>

            {/* Layout Controls */}
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

                {showLayoutDropdown && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLayoutDropdown(false)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
