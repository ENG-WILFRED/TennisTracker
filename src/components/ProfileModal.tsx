'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, MapPin, Calendar, Mail, Phone, Users, X } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  bio?: string;
  phone?: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
  } | null;
  ranking?: {
    currentRank: number;
    ratingPoints: number;
    matchesWon: number;
    matchesLost: number;
    winRate: number;
  } | null;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function ProfileModal({ isOpen, onClose, userId }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(`/api/user/profile/${userId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data: UserProfile = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, userId]);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Player Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-24 w-24 rounded-full mx-auto bg-gray-300 dark:bg-slate-700 animate-pulse" />
              <div className="h-6 w-3/4 mx-auto bg-gray-300 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-1/2 mx-auto bg-gray-300 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : profile ? (
            <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full mb-4 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={profile.firstName}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  getInitials(profile.firstName, profile.lastName)
                )}
              </div>

              <h2 className="text-xl font-bold">
                {profile.firstName} {profile.lastName}
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>

              {profile.bio && (
                <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 max-w-xs">{profile.bio}</p>
              )}
            </div>

            {/* Organization and Ranking */}
            {profile.organization && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
                  <Users className="h-4 w-4" />
                  <span>{profile.organization.name}</span>
                </div>

                {profile.ranking && (
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Rank</div>
                        <div className="font-bold text-sm">#{profile.ranking.currentRank}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Rating Points</div>
                      <div className="font-bold text-sm">{profile.ranking.ratingPoints}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
                      <div className="font-bold text-sm">{(profile.ranking.winRate * 100).toFixed(1)}%</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Record</div>
                      <div className="font-bold text-sm">
                        {profile.ranking.matchesWon}W-{profile.ranking.matchesLost}L
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Personal Information</h3>

              {profile.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                    <div className="text-sm">{profile.email}</div>
                  </div>
                </div>
              )}

              {profile.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                    <div className="text-sm">{profile.phone}</div>
                  </div>
                </div>
              )}

              {profile.gender && (
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Gender</div>
                    <span className="inline-block px-2 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded capitalize text-gray-700 dark:text-gray-300">
                      {profile.gender}
                    </span>
                  </div>
                </div>
              )}

              {profile.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</div>
                    <div className="text-sm">
                      {formatDate(profile.dateOfBirth)} ({calculateAge(profile.dateOfBirth)} years old)
                    </div>
                  </div>
                </div>
              )}

              {profile.nationality && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Nationality</div>
                    <div className="text-sm">{profile.nationality}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 pt-2 border-t border-gray-200 dark:border-slate-700">
                <div className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Member Since</div>
                  <div className="text-sm">{formatDate(profile.createdAt)}</div>
                </div>
              </div>
            </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">No profile found</div>
          )}
        </div>
      </div>
    </div>
  );
}
