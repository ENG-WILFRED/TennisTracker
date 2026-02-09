import "../styles/globals.css";
import type { ReactNode } from "react";
import FloatingMessagesPanel from "@/components/FloatingMessagesPanel";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <FloatingMessagesPanel />
        </AuthProvider>
      </body>
    </html>
  );
}
