'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/chat/ChatContext';
import FloatingMessagesPanel from '@/components/FloatingMessagesPanel';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();

  // Public pages that don't require authentication
  const publicPaths = ['/'];

  const isPublicPage = publicPaths.includes(pathname);

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <ChatProvider>
        {children}
        <FloatingMessagesPanel />
      </ChatProvider>
    </AuthProvider>
  );
}