'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
  duration?: number;
}

const colors = {
  error: { bg: 'rgba(217, 79, 79, 0.1)', border: 'rgba(217, 79, 79, 0.3)', text: '#d94f4f' },
  success: { bg: 'rgba(121, 191, 62, 0.1)', border: 'rgba(121, 191, 62, 0.3)', text: '#79bf3e' },
  info: { bg: 'rgba(74, 158, 255, 0.1)', border: 'rgba(74, 158, 255, 0.3)', text: '#4a9eff' },
};

const icons = {
  error: '❌',
  success: '✅',
  info: 'ℹ️',
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}`;
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, show, remove };
}

export function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 400,
      }}
    >
      {toasts.map(toast => {
        const color = colors[toast.type];
        const icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            style={{
              background: color.bg,
              border: `1px solid ${color.border}`,
              borderRadius: 8,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: color.text,
              fontSize: 13,
              fontWeight: 500,
              animation: 'slideIn 0.3s ease-out',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => onClose(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: color.text,
                cursor: 'pointer',
                fontSize: 16,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                opacity: 0.6,
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
