import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export const Tabs = ({ value, onValueChange, defaultValue, children, className = '' }: {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className = '' }: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const context = useContext(TabsContext);
  if (!context) return null;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        context.value === value
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-muted hover:text-foreground'
      } ${className}`}
      onClick={() => context.onValueChange(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = '' }: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const context = useContext(TabsContext);
  if (!context || context.value !== value) return null;

  return <div className={className}>{children}</div>;
};