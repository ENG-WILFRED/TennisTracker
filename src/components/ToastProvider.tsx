"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";
type Toast = { id: string; type: ToastType; message: string };

const ToastContext = createContext({
  showToast: (message: string, type?: ToastType) => {}
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = String(Date.now() + Math.random());
    const t = { id, type, message };
    setToasts((s) => [t, ...s]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div key={t.id} className={`w-80 px-4 py-3 rounded-md shadow font-semibold text-sm border ${t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : t.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-sky-50 text-sky-800 border-sky-200'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
