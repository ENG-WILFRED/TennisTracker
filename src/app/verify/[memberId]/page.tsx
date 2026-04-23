'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface VerificationData {
  valid: boolean;
  member?: {
    name: string;
    email: string;
    memberId: string;
    role: string;
    status: string;
    organization: string;
    accessLevel: string;
    joinedDate: string;
    approvedDate: string;
    expiryDate: string;
    isExpired: boolean;
  };
  verifiedAt: string;
}

export default function VerifyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memberId = params.memberId as string;
  const orgId = searchParams.get('org');

  useEffect(() => {
    if (!memberId || !orgId) {
      setError('Invalid verification link');
      setLoading(false);
      return;
    }

    fetch(`/api/verify/${memberId}?org=${orgId}`)
      .then(res => res.json())
      .then(data => {
        setVerificationData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Verification error:', err);
        setError('Failed to verify membership');
        setLoading(false);
      });
  }, [memberId, orgId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Membership</h2>
          <p className="text-gray-600">Please wait while we verify your membership card...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!verificationData?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Membership</h2>
          <p className="text-gray-600">This membership card is not valid or has expired.</p>
        </div>
      </div>
    );
  }

  const member = verificationData.member!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Membership Verified</h2>
          <p className="text-gray-600">This membership card is valid and active.</p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Member Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{member.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Member ID:</span>
                <span className="font-medium">{member.memberId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">{member.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Organization:</span>
                <span className="font-medium">{member.organization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Access Level:</span>
                <span className="font-medium">{member.accessLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Joined:</span>
                <span className="font-medium">{member.joinedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expires:</span>
                <span className={`font-medium ${member.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                  {member.expiryDate}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            Verified at {new Date(verificationData.verifiedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}