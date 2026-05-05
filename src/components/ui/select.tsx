import React, { useState } from 'react';

export const Select = ({ children, value, onValueChange }: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { isOpen, setIsOpen, value, onValueChange })
          : child
      )}
    </div>
  );
};

export const SelectTrigger = ({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>
    {children}
  </button>
);

export const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-muted-foreground">{placeholder}</span>
);

export const SelectContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${className}`}>
    {children}
  </div>
);

export const SelectItem = ({ children, value, className = '' }: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) => (
  <div className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}>
    {children}
  </div>
);