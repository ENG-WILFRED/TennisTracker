'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  playerId: string | null;
  isLoggedIn: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('playerId');
      setPlayerId(stored);
      setIsLoaded(true);
    }
  }, []);

  const logout = () => {
    setPlayerId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('playerId');
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ playerId, isLoggedIn: !!playerId, logout }}>
      {isLoaded && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
