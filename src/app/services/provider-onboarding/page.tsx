'use client';

import React, { useState } from 'react';
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

export default function ProviderOnboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    phone: '',
    description: '',
    categories: [] as string[],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (step === 1) {
      if (!formData.businessName.trim() || !formData.phone.trim()) {
        setError('Please fill in business name and phone');
        setLoading(false);
        return;
      }
      setStep(2);
      setLoading(false);
      return;
    }

    if (step === 2) {
      if (!formData.description.trim()) {
        setError('Please add a business description');
        setLoading(false);
        return;
      }
      setStep(3);
      setLoading(false);
      return;
    }

    if (step === 3) {
      if (formData.categories.length === 0) {
        setError('Please select at least one service category');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/providers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create provider profile');
        }

        // Redirect to services dashboard
        router.push('/services');
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1510] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 mx-1 rounded-full ${
                  s <= step ? 'bg-[#7dc142]' : 'bg-[rgba(99,153,34,0.1)]'
                }`}
              />
            ))}
          </div>
          <div className="text-center text-[#c8e0a8]">
            Step {step} of 3
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-[#162818] border border-[rgba(99,153,34,0.2)] rounded-lg p-8">
            {/* Step 1: Business Info */}
            {step === 1 && (
              <div>
                <h2 className="text-3xl font-bold text-[#e8f8d8] mb-2">Tell us about your business</h2>
                <p className="text-[#c8e0a8] mb-8">We'll use this information to set up your provider profile.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[#8dc843] font-semibold mb-2">Business Name *</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="e.g., Elite Tennis Academy"
                      className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] placeholder-[#4a6335] focus:outline-none focus:border-[#7dc142]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8dc843] font-semibold mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] placeholder-[#4a6335] focus:outline-none focus:border-[#7dc142]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Description */}
            {step === 2 && (
              <div>
                <h2 className="text-3xl font-bold text-[#e8f8d8] mb-2">Describe your services</h2>
                <p className="text-[#c8e0a8] mb-8">Help players understand what you offer and why they should choose you.</p>

                <div>
                  <label className="block text-[#8dc843] font-semibold mb-2">Business Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Share your experience, expertise, and what makes your service unique..."
                    rows={6}
                    className="w-full bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-lg px-4 py-3 text-[#e8f8d8] placeholder-[#4a6335] focus:outline-none focus:border-[#7dc142] resize-none"
                  />
                  <p className="text-sm text-[#4a6335] mt-2">{formData.description.length} / 500 characters</p>
                </div>
              </div>
            )}

            {/* Step 3: Categories */}
            {step === 3 && (
              <div>
                <h2 className="text-3xl font-bold text-[#e8f8d8] mb-2">Select your service categories</h2>
                <p className="text-[#c8e0a8] mb-8">Choose the categories that best describe your services.</p>

                <div className="grid grid-cols-2 gap-4">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`p-4 rounded-lg border-2 font-semibold transition-all text-left ${
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
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  className="flex-1 bg-[rgba(99,153,34,0.1)] text-[#8dc843] px-6 py-3 rounded-lg font-semibold hover:bg-[rgba(99,153,34,0.2)] disabled:opacity-50"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#7dc142] hover:bg-[#6ba83a] disabled:bg-[#4a6335] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Loading...' : step === 3 ? 'Create Provider Profile' : 'Next Step'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
