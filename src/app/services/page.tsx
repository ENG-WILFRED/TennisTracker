'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import ProviderDashboard from './components/ProviderDashboard';
import PlayerServiceDashboard from './components/PlayerServiceDashboard';
import Link from 'next/link';

export default function ServicesPage() {
  const { user, isLoading } = useAuth();
  const { currentRole } = useRole();
  const [isProvider, setIsProvider] = useState(false);
  const [checkingProvider, setCheckingProvider] = useState(true);

  useEffect(() => {
    if (!user?.id || isLoading) return;

    const checkProviderStatus = async () => {
      try {
        const response = await fetch('/api/providers', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsProvider(!!data.provider?.id);
        }
      } catch (error) {
        console.error('Error checking provider status:', error);
      } finally {
        setCheckingProvider(false);
      }
    };

    checkProviderStatus();
  }, [user, isLoading]);

  if (isLoading || checkingProvider) {
    return (
      <div className="min-h-screen bg-[#0a1510] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7dc142]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a1510] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#e8f8d8] mb-4">Services Dashboard</h1>
          <p className="text-[#c8e0a8] mb-6">Please log in to access services.</p>
          <Link href="/login" className="bg-[#7dc142] hover:bg-[#6ba83a] text-white px-6 py-2 rounded-lg font-semibold">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Show provider dashboard if user is a provider
  if (isProvider) {
    return <ProviderDashboard />;
  }

  // Show player/buyer dashboard
  if (currentRole === 'player') {
    return <PlayerServiceDashboard />;
  }

  // Show provider onboarding for eligible users
  return (
    <div className="min-h-screen bg-[#0a1510] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-8 text-center">
          <h1 className="text-4xl font-bold text-[#e8f8d8] mb-4">Would you like to become a Service Provider?</h1>
          <p className="text-[#c8e0a8] mb-8 text-lg">
            Join our platform to offer coaching, training, nutrition, or other tennis-related services to our community.
          </p>
          <Link
            href="/services/provider-onboarding"
            className="inline-block bg-[#7dc142] hover:bg-[#6ba83a] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Provider Journey
          </Link>
        </div>
      </div>
    </div>
  );
}
