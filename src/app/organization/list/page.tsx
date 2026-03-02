"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useAuth } from '@/context/AuthContext';
import CreateOrgForm from '@/components/organization/CreateOrgForm';
import OrganizationListHeader from '@/components/organization/OrganizationListHeader';
import OrganizationSidebar from '@/components/organization/OrganizationSidebar';
import OrganizationGrid from '@/components/organization/OrganizationGrid';
import OrganizationInfoBanner from '@/components/organization/OrganizationInfoBanner';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  city?: string;
  country?: string;
  logo?: string;
  primaryColor?: string;
  rating?: number;
  ratingCount?: number;
  verifiedBadge?: boolean;
  activityScore?: number;
  playerDevScore?: number;
  tournamentEngScore?: number;
  createdAt?: string;
  _count?: {
    members?: number;
    courts?: number;
    events?: number;
  };
}

export default function OrganizationListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'activity'>('rating');
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [countries, setCountries] = useState<string[]>([]);

  // Check URL for create action
  const isCreateModalOpen = searchParams.get('action') === 'create';

  useEffect(() => {
    if (!isLoading) fetchOrgs();
  }, [isLoading]);

  useEffect(() => {
    filterAndSort();
    extractCountries();
  }, [orgs, searchTerm, sortBy, selectedCountry]);

  async function fetchOrgs() {
    try {
      setLoading(true);
      const res = await authenticatedFetch('/api/organization', { requireAuth: false });
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  }

  function extractCountries() {
    const uniqueCountries = Array.from(new Set(orgs.map(org => org.country).filter(Boolean)));
    setCountries(uniqueCountries as string[]);
  }

  function filterAndSort() {
    let filtered = orgs;

    if (searchTerm) {
      filtered = orgs.filter(
        (org) =>
          org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCountry) {
      filtered = filtered.filter(org => org.country === selectedCountry);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'activity':
          return (b.activityScore || 0) - (a.activityScore || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredOrgs(filtered);
  }

  const handleCloseModal = useCallback(() => {
    router.push('/organization/list', { scroll: false });
  }, [router]);

  const handleOrgCreated = (org: Organization) => {
    setOrgs(prev => [org, ...prev]);
    handleCloseModal();
  };

  const handleBackButton = useCallback(() => {
    if (isCreateModalOpen) {
      handleCloseModal();
    } else {
      router.back();
    }
  }, [isCreateModalOpen, handleCloseModal, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      {/* Modal for Create Organization */}
      <CreateOrgForm
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleOrgCreated}
      />

      {/* Header */}
      <OrganizationListHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        isCreateModalOpen={isCreateModalOpen}
        onBackClick={handleBackButton}
      />

      {/* Main Content with Sidebar and Grid */}
      <div className="w-full mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <OrganizationSidebar
          orgs={orgs}
          filteredOrgs={filteredOrgs}
          countries={countries}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
        />

        {/* Grid Content */}
        <div className="lg:col-span-3">
          <OrganizationGrid orgs={filteredOrgs} />
        </div>
      </div>

      {/* Info Banner */}
      <OrganizationInfoBanner />
    </div>
  );
}
