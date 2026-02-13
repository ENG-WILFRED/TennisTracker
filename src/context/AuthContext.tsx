'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import {
  storeTokens,
  clearTokens,
  getStoredTokens,
  recordActivity,
  isUserInactive,
  refreshAccessToken,
  getAccessToken,
} from '@/lib/tokenManager';
import InactivityModal from '@/components/InactivityModal';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
  role?: string | null;
}

interface AuthContextType {
  playerId: string | null;
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => void;
  login: (tokens: { accessToken: string; refreshToken: string }, user: User) => void;
  recordActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [inactivityCheckInterval, setInactivityCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize auth from stored tokens
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const tokens = getStoredTokens();
      const storedUser = localStorage.getItem('currentUser');

      if (tokens && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setPlayerId(userData.id);
          setUser(userData);
          recordActivity();
        } catch (error) {
          console.error('Failed to restore auth:', error);
          clearTokens();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Handle inactivity check
  useEffect(() => {
    if (!playerId) return;

    const checkInactivity = async () => {
      if (isUserInactive()) {
        setShowInactivityModal(true);
      }
    };

    // Check inactivity every minute
    const interval = setInterval(checkInactivity, 60000);
    setInactivityCheckInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playerId]);

  // Set up activity listeners
  useEffect(() => {
    if (!playerId) return;

    const handleUserActivity = () => {
      recordActivity();
      setShowInactivityModal(false);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [playerId]);

  const handleActivityRecord = useCallback(() => {
    recordActivity();
    setShowInactivityModal(false);
  }, []);

  const logout = useCallback(() => {
    setPlayerId(null);
    setUser(null);
    clearTokens();

    if (inactivityCheckInterval) {
      clearInterval(inactivityCheckInterval);
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, [inactivityCheckInterval]);

  const login = useCallback(
    (tokens: { accessToken: string; refreshToken: string }, userData: User) => {
      storeTokens(tokens);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('playerId', userData.id);
      setPlayerId(userData.id);
      setUser(userData);
      recordActivity();
      setShowInactivityModal(false);
    },
    []
  );

  const handleStayLoggedIn = async () => {
    recordActivity();
    setShowInactivityModal(false);

    // Try to refresh the token
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      logout();
    }
  };

  const handleInactivityLogout = () => {
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        playerId,
        user,
        isLoggedIn: !!playerId,
        isLoading,
        logout,
        login,
        recordActivity: handleActivityRecord,
      }}
    >
      {isLoading ? <div /> : children}
      <InactivityModal
        isOpen={showInactivityModal}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleInactivityLogout}
      />
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
