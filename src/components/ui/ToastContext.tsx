'use client';
import React, { createContext, useContext, useCallback } from 'react';
import { toast as designToast } from '@vico/design-system';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    // Map local toast types to design-system toast API
    if (type === 'success') {
      designToast.success(message, { duration });
    } else if (type === 'error') {
      designToast.error(message, { duration });
    } else if (type === 'warning') {
      designToast(message, { duration });
    } else {
      designToast(message, { duration });
    }
  }, []);

  const removeToast = useCallback((id?: string) => {
    if (id) designToast.dismiss(id);
    else designToast.dismiss();
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// The design-system Toaster handles rendering toasts — keep this container as a no-op
export function ToastContainer() {
  return null;
}
