"use client";

import { useMemo, useState } from 'react';

interface Organization {
  id: string;
  name?: string;
  city?: string;
  country?: string;
  rating?: number;
  activityScore?: number;
  createdAt?: string;
}

interface OrganizationSidebarProps {
  orgs: Organization[];
  filteredOrgs: Organization[];
  countries: string[];
  selectedCountry: string;
  onCountryChange: (country: string) => void;
}

const KENYAN_COUNTIES = [
  'Mombasa','Kwale','Kilifi','Tana River','Lamu','Taita-Taveta','Garissa','Wajir','Mandera','Marsabit',
  'Isiolo','Meru','Tharaka-Nithi','Embu','Kitui','Machakos','Makueni','Nyandarua','Nyeri','Kirinyaga',
  'Murang\'a','Kiambu','Turkana','West Pokot','Samburu','Trans-Nzoia','Uasin Gishu','Elgeyo-Marakwet','Nandi','Baringo',
  'Laikipia','Nakuru','Narok','Kajiado','Kericho','Bomet','Kakamega','Vihiga','Bungoma','Busia','Siaya','Kisumu','Homa Bay','Migori','Kisii','Nyamira','Nairobi'
];

export default function OrganizationSidebar({
  orgs,
  filteredOrgs,
  countries,
  selectedCountry,
  onCountryChange,
}: OrganizationSidebarProps) {
  const [mode, setMode] = useState<'countries' | 'counties'>('countries');
  const [searchValue, setSearchValue] = useState('');

  const avgActivity = useMemo(() => {
    const sum = filteredOrgs.reduce((s, o) => s + (o.activityScore || 0), 0);
    return (sum / Math.max(filteredOrgs.length, 1)).toFixed(0);
  }, [filteredOrgs]);

  const avgRating = useMemo(() => {
    const sum = filteredOrgs.reduce((s, o) => s + (o.rating || 0), 0);
    return (sum / Math.max(filteredOrgs.length, 1)).toFixed(1);
  }, [filteredOrgs]);

  const topCities = useMemo(() => {
    const counts: Record<string, number> = {};
    orgs.forEach((o) => {
      if (o.city) counts[o.city] = (counts[o.city] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orgs]);

  const recentClubs = useMemo(() => orgs.slice(0, 3), [orgs]);

  const filteredCounties = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return KENYAN_COUNTIES.filter((c) => c.toLowerCase().includes(q));
  }, [searchValue]);

  return (
    <aside className="lg:col-span-1">
      <div className="bg-white rounded-xl shadow-lg p-6 sticky top-20 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Filters & Stats</h2>
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setMode('countries')}
              className={`px-2 py-1 rounded-full text-xs font-semibold ${mode === 'countries' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
            >
              Countries
            </button>
            <button
              onClick={() => setMode('counties')}
              className={`px-2 py-1 rounded-full text-xs font-semibold ${mode === 'counties' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
            >
              Counties
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-xl font-bold text-blue-600">{orgs.length}</div>
            <div className="text-xs text-gray-500">Clubs</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-xl font-bold text-green-600">{filteredOrgs.length}</div>
            <div className="text-xs text-gray-500">Matching</div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-center">
            <div className="text-xl font-bold text-indigo-600">{avgActivity}%</div>
            <div className="text-xs text-gray-500">Avg Activity</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">Average Rating</div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-3 bg-yellow-400" style={{ width: `${Math.min(Number(avgRating) * 20, 100)}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-2">{avgRating} / 5</div>
        </div>

        <div className="border-t border-gray-100 my-4" />

        {mode === 'countries' ? (
          countries.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Countries</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onCountryChange('')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                    selectedCountry === '' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Countries
                </button>
                {countries.map((country) => (
                  <button
                    key={country}
                    onClick={() => onCountryChange(country)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      selectedCountry === country ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          <div>
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Kenyan Counties</h3>
            <input
              placeholder="Search counties..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3 text-sm"
            />
            <div className="max-h-48 overflow-auto space-y-1">
              <button
                onClick={() => onCountryChange('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCountry === '' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Counties
              </button>
              {filteredCounties.map((county) => (
                <button
                  key={county}
                  onClick={() => onCountryChange(county)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCountry === county ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {county}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 my-4" />

        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Top Cities</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {topCities.length === 0 ? (
              <li className="text-xs text-gray-400">No city data</li>
            ) : (
              topCities.map(([city, count]) => (
                <li key={city} className="flex items-center justify-between">
                  <span>{city}</span>
                  <span className="text-xs text-gray-500">{count}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Clubs</h4>
          <ul className="space-y-2">
            {recentClubs.map((c) => (
              <li key={c.id} className="text-sm text-gray-700">
                <div className="font-medium">{c.name || 'Untitled Club'}</div>
                <div className="text-xs text-gray-500">{c.city || c.country || ''}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          <button onClick={() => onCountryChange('')} className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold">Reset Filter</button>
        </div>
      </div>
    </aside>
  );
}
