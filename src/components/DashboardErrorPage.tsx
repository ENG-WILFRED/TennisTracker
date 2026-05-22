'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface DashboardErrorPageProps {
  error: string;
  title?: string;
  icon?: string;
  backgroundColor?: string;
  showLogout?: boolean;
}

/**
 * Universal error page component for all dashboards
 * Provides refresh and logout functionality
 */
export function DashboardErrorPage({
  error,
  title = 'Error Loading Dashboard',
  icon = '❌',
  backgroundColor = '#1a1a1a',
  showLogout = true,
}: DashboardErrorPageProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Force redirect to login even if logout fails
      router.push('/login');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl border"
        style={{
          backgroundColor: '#0f0f0f',
          borderColor: 'rgba(255, 59, 48, 0.3)',
        }}
      >
        {/* Icon */}
        <div className="text-6xl text-center mb-6">{icon}</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white text-center mb-4">
          {title}
        </h1>

        {/* Error Message */}
        <div
          className="rounded-lg p-4 mb-8 text-sm text-center border"
          style={{
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            borderColor: 'rgba(255, 59, 48, 0.3)',
            color: '#ff6b6b',
          }}
        >
          <p className="font-medium mb-2">Error Details:</p>
          <p className="break-words">{error}</p>
        </div>

        {/* Helpful Information */}
        <div
          className="rounded-lg p-4 mb-8 text-sm"
          style={{
            backgroundColor: 'rgba(100, 200, 255, 0.05)',
            borderColor: 'rgba(100, 200, 255, 0.2)',
            borderWidth: 1,
          }}
        >
          <p className="text-gray-300 mb-2">
            <strong>💡 What you can try:</strong>
          </p>
          <ul className="text-gray-400 space-y-1">
            <li>• Refresh the page to retry</li>
            <li>• Clear your browser cache</li>
            <li>• Logout and login again</li>
            <li>• Check your internet connection</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 text-white"
            style={{
              backgroundColor: '#4CAF50',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#45a049';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4CAF50';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔄 Refresh Page
          </button>

          {/* Logout Button */}
          {showLogout && (
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 text-white"
              style={{
                backgroundColor: '#FF6B6B',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ff5252';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FF6B6B';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🚪 Logout & Go to Login
            </button>
          )}

          {/* Back Home Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            style={{
              backgroundColor: '#666666',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#777777';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 100, 100, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#666666';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Footer Info */}
        <div className="text-xs text-gray-500 text-center mt-6">
          <p>If the problem persists, please contact support</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardErrorPage;
