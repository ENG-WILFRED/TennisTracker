'use client';

import React from 'react';

const baseCardClasses = 'rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm';
const cardVariants: Record<string, string> = {
  glow: 'shadow-[0_10px_40px_rgba(125,193,66,0.18)]',
  elevated: 'shadow-lg',
  outline: 'bg-transparent border-white/10',
};

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof cardVariants;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ variant, className = '', children, ...props }) => (
  <div className={`${baseCardClasses} ${variant ? cardVariants[variant] : ''} ${className}`.trim()} {...props}>
    {children}
  </div>
);

const buttonVariants: Record<string, string> = {
  primary: 'bg-[#7dc142] text-slate-950 hover:bg-[#90d95d] focus:ring-2 focus:ring-[#7dc142]/50',
  secondary: 'bg-slate-900 text-white border border-white/10 hover:bg-slate-800 focus:ring-2 focus:ring-slate-500/40',
  ghost: 'bg-transparent text-white hover:bg-white/5 focus:ring-2 focus:ring-white/20',
  text: 'bg-transparent text-white underline-offset-2 hover:underline focus:ring-2 focus:ring-white/20',
  danger: 'bg-[#ef4444] text-white hover:bg-[#f87171] focus:ring-2 focus:ring-[#ef4444]/50',
};

const buttonSizes: Record<string, string> = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  className?: string;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', type = 'button', children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant] ?? buttonVariants.primary} ${buttonSizes[size] ?? buttonSizes.md} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#7dc142]/60 focus:ring-2 focus:ring-[#7dc142]/15 ${className}`.trim()}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const colors = {
  background: '#05390e',
  surface: '#1b791d',
  surfaceSecondary: '#154816',
  surfaceTertiary: '#2c6a17',
  border: 'rgba(53, 190, 23, 0.08)',
  primary: '#219e2a',
  primaryHover: '#115e11',
  accent: '#10b981',
  textPrimary: '#e2e8f0',
  textMuted: '#94a3b8',
  warning: '#fbbf24',
  danger: '#f87171',
  info: '#38bdf8',
  success: '#22c55e',
  color: '#e2e8f0',
  inverse: '#ffffff',
};
