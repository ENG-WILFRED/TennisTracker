"use client";

import React, { ButtonHTMLAttributes, useState } from 'react';

type AsyncButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void | Promise<void>;
  variant?: 'solid' | 'outline';
};

export default function Button({ children, onClick, disabled, className = '', variant = 'solid', ...rest }: AsyncButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (loading || disabled) return;
    try {
      const res = onClick && onClick(e);
      if (res && typeof (res as Promise<void>).then === 'function') {
        setLoading(true);
        await res;
      }
    } finally {
      setLoading(false);
    }
  };

  const base = variant === 'outline' ? 'btn-outline' : 'btn';

  return (
    <button {...rest} onClick={handleClick} disabled={disabled || loading} className={`${base} ${className} inline-flex items-center justify-center`}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
