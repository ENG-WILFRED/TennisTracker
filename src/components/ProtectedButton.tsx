'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { ReactNode } from 'react';

interface ProtectedButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function ProtectedButton({
  href,
  onClick,
  children,
  className = '',
  variant = 'primary',
}: ProtectedButtonProps) {
  const { isLoggedIn } = useAuth();

  const baseClasses = 'inline-flex items-center gap-2 rounded-lg font-semibold transition-all';
  const variantClasses =
    variant === 'primary'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'border border-emerald-600 text-emerald-600 hover:bg-emerald-50';

  if (!isLoggedIn) {
    return (
      <div className="relative group">
        <button
          disabled
          className={`${baseClasses} ${variantClasses} opacity-50 cursor-not-allowed ${className}`}
        >
          <Lock className="w-4 h-4" />
          {children}
        </button>

        {/* Login Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 text-white rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-xs whitespace-nowrap">
          <p className="font-semibold mb-2">Login Required</p>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="flex-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-center"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="flex-1 border border-blue-400 px-2 py-1 rounded text-center hover:bg-blue-900"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - render normal button
  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${variantClasses} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </button>
  );
}
