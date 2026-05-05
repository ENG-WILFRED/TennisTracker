import React from 'react';

export const Alert = ({ children, variant, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: string }) => (
  <div
    className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${variant === 'destructive' ? 'border-red-500 bg-red-50 text-red-900' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const AlertDescription = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props}>
    {children}
  </div>
);