'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const SERVICE_CATEGORIES = [
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

const SERVICE_TYPES = [
  'Platform-listed',
  'External-link',
  'Booking-request'
];

const CONTEXT_TYPES = [
  'tournament',
  'court_booking',
  'spectator',
  'both'
];

export default function CreateServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    serviceType: '',
    contextType: '',
    price: '',
    location: '',
    externalUrl: '',
    contextId: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim() || !formData.description.trim() || !formData.category || !formData.serviceType || !formData.contextType) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.serviceType === 'External-link' && !formData.externalUrl.trim()) {
      setError('External URL is required for external services');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          serviceType: formData.serviceType,
          contextType: formData.contextType,
          price: formData.price ? parseFloat(formData.price) : null,
          location: formData.location.trim() || null,
          externalUrl: formData.externalUrl.trim() || null,
          contextId: formData.contextId.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create service');
      }

      router.push('/services');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1510] p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#e8f8d8] mb-2">Create New Service</h1>
        <p className="text-[#c8e0a8] mb-8">Add a new service to your portfolio.</p>

        <form onSubmit={handleSubmit}>
          <div className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-8 space-y-6">
            {/* Service Name */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-2">Service Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Personalized Tennis Coaching"
                className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] placeholder-[#4a6335] focus:outline-none focus:border-[#7dc142]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your service in detail..."
                rows={5}
                className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] placeholder-[#4a6335] focus:outline-none focus:border-[#7dc142] resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] focus:outline-none focus:border-[#7dc142]"
              >
                <option value="">Select a category</option>
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-2">Service Type *</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] focus:outline-none focus:border-[#7dc142]"
              >
                <option value="">Select service type</option>
                {SERVICE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Context Type */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-2">Context *</label>
              <select
                name="contextType"
                value={formData.contextType}
                onChange={handleInputChange}
                className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] focus:outline-none focus:border-[#7dc142]"
              >
                <option value="">Select context</option>
                {CONTEXT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-2">Price (USD)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g., 50"
                step="0.01"
                min="0"
                className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] placeholder-[#4a6335] focus:outline-none focus:border-[#7dc142]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-[#8dc843] font-semibold mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Central Tennis Courts"
                className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] placeholder-[#4a6335] focus:outline-none focus:border-[#7dc142]"
              />
            </div>

            {/* External URL - show if serviceType is External-link */}
            {formData.serviceType === 'External-link' && (
              <div>
                <label className="block text-[#8dc843] font-semibold mb-2">External URL *</label>
                <input
                  type="url"
                  name="externalUrl"
                  value={formData.externalUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/service"
                  className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] placeholder-[#4a6335] focus:outline-none focus:border-[#7dc142]"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
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
                disabled={loading}
                className="flex-1 bg-[#7dc142] hover:bg-[#6ba83a] disabled:bg-[#4a6335] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
