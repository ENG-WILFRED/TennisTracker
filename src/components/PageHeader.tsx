"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  navItems?: {
    label: string;
    href?: string;
    onClick?: () => void;
    active?: boolean;
    variant?: 'solid' | 'outline';
  }[];
}

export default function PageHeader({ title, description, icon, navItems = [] }: PageHeaderProps) {
  const router = useRouter();
  let auth;
  try {
    auth = useAuth();
  } catch (e) {
    auth = { isLoggedIn: false } as any;
  }
  const { isLoggedIn } = auth;
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCanGoBack(window.history.length > 1);
    }
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 mb-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0 flex items-center gap-3">
            {/* Back button for explore (non-logged-in) users */}
            {!isLoggedIn && canGoBack && (
              <button onClick={handleBack} className="mr-2 p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-3 mb-2">
                {icon && <div className="p-3 bg-white/20 rounded-xl">{icon}</div>}
                <h1 className="text-4xl font-bold text-white truncate">{title}</h1>
              </div>
              {description && <p className="text-green-100 truncate">{description}</p>}
            </div>
          </div>

          {navItems.length > 0 && (
            <div className="flex gap-3">
              {navItems.map((item, idx) => (
                item.href ? (
                  <Link
                    key={idx}
                    href={item.href}
                    className={
                      item.active
                        ? 'px-4 py-2 rounded-full bg-white text-green-700 font-semibold'
                        : 'px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-sm transition-all'
                    }
                  >
                    {item.label}
                  </Link>
                ) : item.onClick ? (
                  <button
                    key={idx}
                    onClick={item.onClick}
                    className={
                      item.active
                        ? 'px-4 py-2 rounded-full bg-white text-green-700 font-semibold'
                        : 'px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/40 backdrop-blur-sm transition-all'
                    }
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    key={idx}
                    className={
                      item.active
                        ? 'px-4 py-2 rounded-full bg-white text-green-700 font-semibold inline-flex items-center'
                        : 'px-4 py-2 rounded-full bg-white/20 text-white inline-flex items-center'
                    }
                  >
                    {item.label}
                  </span>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
