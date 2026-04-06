'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/chat/ChatContext';
import FloatingMessagesPanel from '@/components/FloatingMessagesPanel';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ChatProvider>
        {children}
        <FloatingMessagesPanel />
      </ChatProvider>
    </AuthProvider>
  );
}