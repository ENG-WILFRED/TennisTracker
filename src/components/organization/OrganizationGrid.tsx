"use client";

import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  description?: string;
  city?: string;
  country?: string;
  primaryColor?: string;
  rating?: number;
  verifiedBadge?: boolean;
  activityScore?: number;
  playerDevScore?: number;
  tournamentEngScore?: number;
}

interface OrganizationGridProps {
  orgs: Organization[];
}

export default function OrganizationGrid({ orgs }: OrganizationGridProps) {
  if (orgs.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">No clubs found</h3>
        <p className="text-gray-500">Try adjusting your search or create a new club</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {orgs.map((org) => (
        <Link key={org.id} href={`/organization/${org.id}`}>
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105 h-full">
            {/* Card Header with Color */}
            <div
              className="h-3"
              style={{ backgroundColor: org.primaryColor || '#0ea5e9' }}
            ></div>

            {/* Card Content */}
            <div className="p-6">
              {/* Badge and Rating */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {org.verifiedBadge && (
                    <div className="inline-flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                {org.rating && (
                  <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                    <span className="text-lg">⭐</span>
                    <span className="font-bold">{org.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Organization Name */}
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{org.name}</h3>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">{org.description}</p>

              {/* Location */}
              {(org.city || org.country) && (
                <div className="flex items-center space-x-1 text-gray-500 text-sm mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {org.city}
                    {org.city && org.country && ', '}
                    {org.country}
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{org.activityScore || 0}%</div>
                  <div className="text-xs text-gray-500">Activity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{org.playerDevScore || 0}%</div>
                  <div className="text-xs text-gray-500">Dev Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{org.tournamentEngScore || 0}%</div>
                  <div className="text-xs text-gray-500">Tournaments</div>
                </div>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-lg font-semibold transition-all">
                View Details →
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
