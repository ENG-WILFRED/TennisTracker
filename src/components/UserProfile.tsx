// Example React Component: User Profile with Follow Button
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface UserProfile {
  user: User;
  followers: User[];
  following: User[];
  isFollowing: boolean;
}

interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Load user profile and followers
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const [followersRes, followingRes] = await Promise.all([
          fetch(`/api/community?action=followers&userId=${userId}`),
          fetch(`/api/community?action=following&userId=${userId}`)
        ]);

        const followersData = await followersRes.json();
        const followingData = await followingRes.json();

        // Check if current user is following this user
        const isFollowingUser = 
          followingData.following?.some((u: User) => u.id === userId) ?? false;

        setProfile({
          user: { id: userId, name: 'User Name', email: 'user@example.com' },
          followers: followersData.followers ?? [],
          following: followingData.following ?? [],
          isFollowing: isFollowingUser
        });
        setIsFollowing(isFollowingUser ?? false);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [userId, session]);

  // Handle follow/unfollow
  async function handleFollow() {
    if (!session?.user) return;

    setFollowLoading(true);
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'follow',
          data: { userId }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newIsFollowing = data.action === 'followed';
        setIsFollowing(newIsFollowing);

        // Update follower count in profile
        if (profile) {
          setProfile({
            ...profile,
            isFollowing: newIsFollowing,
            followers: newIsFollowing
              ? [...profile.followers, { id: userId, name: session.user.name || 'User', email: session.user.email || '' }]
              : profile.followers.filter(f => f.id !== userId)
          });
        }
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    } finally {
      setFollowLoading(false);
    }
  }

  if (!profile) {
    return <div>{loading ? 'Loading profile...' : 'Profile not found'}</div>;
  }

  const isOwnProfile = false; // Cannot determine own profile without session user id

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
      {/* Profile Header */}
      <div className="text-center mb-6">
        {profile.user.image && (
          <img
            src={profile.user.image}
            alt={profile.user.name}
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
        )}
        <h1 className="text-2xl font-bold">{profile.user.name}</h1>
        <p className="text-gray-600">{profile.user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div>
          <div className="text-xl font-bold">{profile.followers.length}</div>
          <div className="text-sm text-gray-600">Followers</div>
        </div>
        <div>
          <div className="text-xl font-bold">{profile.following.length}</div>
          <div className="text-sm text-gray-600">Following</div>
        </div>
        <div>
          <div className="text-xl font-bold">12</div>
          <div className="text-sm text-gray-600">Posts</div>
        </div>
      </div>

      {/* Follow Button */}
      {!isOwnProfile && session?.user && (
        <button
          onClick={handleFollow}
          disabled={followLoading}
          className={`w-full py-2 rounded-lg font-semibold transition ${
            isFollowing
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } disabled:opacity-50`}
        >
          {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
        </button>
      )}

      {/* Followers List */}
      {profile.followers.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-3">Followers</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {profile.followers.slice(0, 5).map((follower) => (
              <div
                key={follower.id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
              >
                {follower.image && (
                  <img
                    src={follower.image}
                    alt={follower.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-sm">{follower.name}</div>
                </div>
              </div>
            ))}
            {profile.followers.length > 5 && (
              <div className="text-sm text-gray-600 p-2">
                +{profile.followers.length - 5} more followers
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
