'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ServiceCard {
  id: string;
  name: string;
  description: string;
  category: string;
  price?: number;
  location?: string;
  provider: {
    businessName: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function PlayerServiceDashboard() {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceCard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categories = ['all', 'coaching', 'nutrition', 'equipment', 'accommodation', 'transportation', 'training'];

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredServices(services);
    } else {
      setFilteredServices(services.filter(s => s.category.toLowerCase() === selectedCategory));
    }
  }, [selectedCategory, services]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services?contextType=both', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
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

  return (
    <div className="min-h-screen bg-[#0a1510] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#e8f8d8] mb-2">Services Marketplace</h1>
          <p className="text-[#c8e0a8]">Explore services from trusted providers in our community</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#7dc142] text-white'
                    : 'bg-[rgba(99,153,34,0.1)] text-[#8dc843] hover:bg-[rgba(99,153,34,0.2)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-12 text-center">
            <p className="text-[#c8e0a8] text-lg">
              {selectedCategory === 'all'
                ? 'No services available yet. Check back soon!'
                : `No ${selectedCategory} services available yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div key={service.id} className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg overflow-hidden hover:border-[rgba(125,193,66,0.4)] transition-all hover:shadow-lg">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[#e8f8d8] flex-1">{service.name}</h3>
                    {service.price && (
                      <div className="text-[#7dc142] font-bold text-lg">${service.price}</div>
                    )}
                  </div>

                  <p className="text-sm text-[#c8e0a8] mb-4 line-clamp-2">{service.description}</p>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[#4a6335]">Provider:</span>
                      <span className="text-[#8dc843]">{service.provider.businessName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#4a6335]">Contact:</span>
                      <span className="text-[#8dc843]">
                        {service.provider.user.firstName} {service.provider.user.lastName}
                      </span>
                    </div>
                    {service.location && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#4a6335]">📍 Location:</span>
                        <span className="text-[#8dc843]">{service.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-[#7dc142] hover:bg-[#6ba83a] text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                      Request Service
                    </button>
                    <button className="flex-1 bg-[rgba(99,153,34,0.1)] text-[#8dc843] px-4 py-2 rounded-lg font-semibold hover:bg-[rgba(99,153,34,0.2)] transition-colors">
                      More Info
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
