"use client";

export default function OrganizationInfoBanner() {
  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-600">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">Premium Club Features</h4>
            <p className="text-gray-600">
              Each club offers court management, membership tiers, tournaments, player rankings, announcements, and detailed analytics. Join a club to access all premium features!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
