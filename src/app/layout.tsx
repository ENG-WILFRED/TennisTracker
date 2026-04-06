import "../styles/globals.css";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import { RoleProvider } from "@/context/RoleContext";
import { Metadata } from "next";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Vico",
  description: "Sport management system .",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Epilogue:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <RoleProvider>
          <Providers>
            {children}
            <Toaster position="top-right" />
          </Providers>
        </RoleProvider>
      </body>
    </html>
  );
}
