'use client';

import React from 'react';

interface LoadingStateProps {
  /** The emoji or icon to display */
  icon?: string;
  /** The loading message */
  message?: string;
  /** Whether this is a full-page loading state (default: true) */
  fullPage?: boolean;
  /** Optional custom styling */
  className?: string;
}

/**
 * Consistent loading state component used throughout the app.
 * Displays a centered icon with animated bounce and a loading message.
 * 
 * @example
 * // Full page loading
 * <LoadingState icon="🎾" message="Loading court details..." />
 * 
 * @example
 * // Section loading
 * <LoadingState 
 *   icon="📊" 
 *   message="Loading analytics..." 
 *   fullPage={false}
 * />
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  icon = '⏳',
  message = 'Loading...',
  fullPage = true,
  className = '',
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  };

  if (fullPage) {
    return (
      <div
        style={{
          ...baseStyles,
          minHeight: '100vh',
          padding: 32,
          background: '#0f1f0f',
          color: '#7aaa6a',
        }}
        className={className}
      >
        <div
          style={{
            fontSize: 48,
            marginBottom: 16,
            animation: 'bounce 1.5s infinite',
          }}
        >
          {icon}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#7aaa6a',
          }}
        >
          {message}
        </div>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        ...baseStyles,
        padding: 40,
        background: '#1a3020',
        border: '1px solid #2d5a35',
        borderRadius: 10,
        color: '#7aaa6a',
      }}
      className={className}
    >
      <div
        style={{
          fontSize: 36,
          marginBottom: 12,
          animation: 'bounce 1.5s infinite',
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#7aaa6a',
        }}
      >
        {message}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};
