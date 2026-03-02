"use client";

import { useRouter } from 'next/navigation';

interface OrganizationListHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'rating' | 'name' | 'activity';
  onSortChange: (sort: 'rating' | 'name' | 'activity') => void;
  isCreateModalOpen: boolean;
  onBackClick: () => void;
}

export default function OrganizationListHeader({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  isCreateModalOpen,
  onBackClick,
}: OrganizationListHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-8 px-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          {/* Back Button */}
          <button
            onClick={onBackClick}
            className="inline-flex items-center space-x-2 hover:bg-white/20 px-3 py-2 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Title */}
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold">Explore Clubs</h1>
              <p className="text-blue-100 text-sm mt-1">Find and join tennis clubs</p>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={() => router.push('/organization/list?action=create')}
            className="bg-white hover:bg-blue-50 text-blue-600 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            + Create Club
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search clubs by name, city, or description..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <div className="flex gap-2">
              {['rating', 'activity', 'name'].map((sort) => (
                <button
                  key={sort}
                  onClick={() => onSortChange(sort as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    sortBy === sort
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {sort === 'rating' ? '⭐ Rating' : sort === 'activity' ? '🔥 Activity' : '📛 Name'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
