'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  'Coaching',
  'Nutrition',
  'Equipment',
  'Accommodation',
  'Transportation',
  'Training',
  'Medical',
  'Photography',
  'Other'
];

interface ProviderProfile {
  id: string;
  businessName: string;
  description: string;
  categories?: string[];
  phone: string;
  isActive: boolean;
}

export default function ProviderSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    phone: '',
    description: '',
    categories: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    fetchProvider();
  }, [user?.id]);

  const fetchProvider = async () => {
    try {
      const response = await fetch('/api/providers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await response.json();
      if (data.provider) {
        setProvider(data.provider);
        setFormData({
          businessName: data.provider.businessName,
          phone: data.provider.phone,
          description: data.provider.description,
          categories: data.provider.categories || [],
          isActive: data.provider.isActive,
        });
      }
    } catch (err) {
      console.error('Error fetching provider:', err);
      setError('Failed to load provider profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/providers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProvider(data.provider);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
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
        <div className="max-w-2xl mx-auto text-center text-[#c8e0a8]">
          <p>Provider profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1510] p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#e8f8d8] mb-2">Provider Settings</h1>
        <p className="text-[#c8e0a8] mb-8">Manage your provider profile and preferences.</p>

        <form onSubmit={handleSubmit}>
          <div className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-8 space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-2">Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] focus:outline-none focus:border-[#7dc142]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] focus:outline-none focus:border-[#7dc142]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-2">Business Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] focus:outline-none focus:border-[#7dc142] resize-none"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-3">Service Categories</label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`p-3 rounded-lg border-2 font-semibold transition-all text-left text-sm ${
                      formData.categories.includes(category)
                        ? 'bg-[rgba(125,193,66,0.2)] border-[#7dc142] text-[#7dc142]'
                        : 'bg-[#0a1510] border-[rgba(99,153,34,0.2)] text-[#c8e0a8] hover:border-[#7dc142]'
                    }`}
                  >
                    {formData.categories.includes(category) && '✓ '}
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleToggleActive}
                  className="w-5 h-5 accent-[#7dc142]"
                />
                <span className="text-[#8dc843] font-semibold">Active Profile</span>
              </label>
              <p className="text-sm text-[#4a6335] mt-2">
                {formData.isActive ? 'Your profile is visible to players' : 'Your profile is hidden from players'}
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                {success}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-[rgba(99,153,34,0.1)] text-[#8dc843] px-6 py-3 rounded-lg font-semibold hover:bg-[rgba(99,153,34,0.2)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#7dc142] hover:bg-[#6ba83a] disabled:bg-[#4a6335] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
