import React from 'react';
import toast, { Toaster as HotToaster } from 'react-hot-toast';
import { toastOptions } from './toast';

// Re-export the toast API so consuming apps import from the design system
export { toast };

// Unified Toaster component that applies the design-system's toastOptions
export function Toaster(props: React.ComponentProps<typeof HotToaster>) {
  return <HotToaster toastOptions={toastOptions} position="top-right" {...props} />;
}

export default Toaster;
