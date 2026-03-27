'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  serviceType: string;
  price?: number;
  location?: string;
  contextType: string;
  contextId?: string;
  isActive: boolean;
  createdAt: string;
}

interface ProviderProfile {
  id: string;
  businessName: string;
  description: string;
  categories?: string[];
  phone: string;
  isActive: boolean;
}

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'requests'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviderData();
  }, [user?.id]);

  const fetchProviderData = async () => {
    try {
      const provRes = await fetch('/api/providers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const profData = await provRes.json();
      setProvider(profData.provider);

      if (profData.provider?.id) {
        const servRes = await fetch(`/api/services?providerId=${profData.provider.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        const servData = await servRes.json();
        setServices(servData.services || []);
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1510] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7dc142]"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-[#0a1510] p-6">
        <div className="max-w-4xl mx-auto text-center text-[#c8e0a8]">
          <p>Provider profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1510] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#e8f8d8] mb-2">{provider.businessName}</h1>
          <p className="text-[#c8e0a8]">{provider.description}</p>
          <div className="mt-4 flex gap-4">
            <Link
              href="/services/create-service"
              className="bg-[#7dc142] hover:bg-[#6ba83a] text-white px-6 py-2 rounded-lg font-semibold"
            >
              Add Service
            </Link>
            <Link
              href="/services/provider-settings"
              className="bg-[rgba(99,153,34,0.2)] hover:bg-[rgba(99,153,34,0.3)] text-[#8dc843] px-6 py-2 rounded-lg font-semibold border border-[rgba(99,153,34,0.3)]"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[rgba(99,153,34,0.1)]">
          {(['overview', 'services', 'requests'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? 'text-[#7dc142] border-[#7dc142]'
                  : 'text-[#c8e0a8] border-transparent hover:text-[#8dc843]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-6">
              <div className="text-sm text-[#4a6335] mb-1">Active Services</div>
              <div className="text-3xl font-bold text-[#7dc142]">{services.filter(s => s.isActive).length}</div>
            </div>
            <div className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-6">
              <div className="text-sm text-[#4a6335] mb-1">Total Services</div>
              <div className="text-3xl font-bold text-[#8dc843]">{services.length}</div>
            </div>
            <div className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-6">
              <div className="text-sm text-[#4a6335] mb-1">Status</div>
              <div className={`text-lg font-bold ${provider.isActive ? 'text-[#7dc142]' : 'text-[#999]'}`}>
                {provider.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            {services.length === 0 ? (
              <div className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-8 text-center">
                <p className="text-[#c8e0a8] mb-4">You haven't created any services yet.</p>
                <Link
                  href="/services/create-service"
                  className="inline-block bg-[#7dc142] hover:bg-[#6ba83a] text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Create Your First Service
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((service) => (
                  <div key={service.id} className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-[#e8f8d8] flex-1">{service.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          service.isActive
                            ? 'bg-[rgba(125,193,66,0.2)] text-[#7dc142]'
                            : 'bg-[rgba(154,154,154,0.2)] text-[#999]'
                        }`}
                      >
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-[#c8e0a8] mb-3">{service.description}</p>
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div>
                        <span className="text-[#4a6335]">Category:</span>
                        <span className="text-[#8dc843] ml-2">{service.category}</span>
                      </div>
                      <div>
                        <span className="text-[#4a6335]">Type:</span>
                        <span className="text-[#8dc843] ml-2">{service.serviceType}</span>
                      </div>
                      {service.price && (
                        <div>
                          <span className="text-[#4a6335]">Price:</span>
                          <span className="text-[#8dc843] ml-2">${service.price}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[#4a6335]">Context:</span>
                        <span className="text-[#8dc843] ml-2">{service.contextType}</span>
                      </div>
                    </div>
                    <Link
                      href={`/services/edit-service/${service.id}`}
                      className="text-sm font-semibold text-[#7dc142] hover:text-[#8dc843]"
                    >
                      Edit →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-8 text-center">
            <p className="text-[#c8e0a8]">Service requests will appear here once players start booking.</p>
          </div>
        )}
      </div>
    </div>
  );
}
