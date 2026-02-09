'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in by checking for auth token/session
    const checkAuth = async () => {
      try {
        // You can check localStorage, cookies, or call an auth endpoint
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (token) {
          setIsLoggedIn(true);
          // Redirect to dashboard if already logged in
          router.push('/dashboard');
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-sky-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🎾</div>
          <p className="text-2xl font-bold text-gray-900">Tennis Tracker</p>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // If logged in, dashboard redirect handled above
  if (isLoggedIn) {
    return null;
  }

  // Show landing page for non-logged-in users
  return <LandingPage />;
}
