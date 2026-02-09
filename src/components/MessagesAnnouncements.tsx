'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock } from 'lucide-react';

export default function MessagesAnnouncements() {
  const { isLoggedIn } = useAuth();
  const [unreadCount] = useState(3); // Placeholder for unread count

  if (!isLoggedIn) {
    return (
      <div className="relative group">
        <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
          <Mail className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Login Tooltip */}
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Login Required</h3>
              <p className="text-sm text-gray-600">Access your messages & announcements</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Sign in to your account to receive notifications about matches, coaches, and important announcements.
          </p>

          <div className="flex gap-3">
            <Link
              href="/login"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-center transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold text-center transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in state
  return (
    <div className="relative group">
      <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
        <Mail className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Messages Dropdown */}
      <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Messages & Announcements</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {/* Sample messages */}
          <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
            <div className="font-semibold text-gray-900 text-sm">Tournament Starting Soon</div>
            <p className="text-xs text-gray-600 mt-1">The World Cup Style Tournament begins next week!</p>
            <span className="text-xs text-gray-400 mt-2 block">2 hours ago</span>
          </div>

          <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
            <div className="font-semibold text-gray-900 text-sm">Match Scheduled</div>
            <p className="text-xs text-gray-600 mt-1">Your match with John Smith is scheduled for tomorrow at 4 PM</p>
            <span className="text-xs text-gray-400 mt-2 block">5 hours ago</span>
          </div>

          <div className="p-4 hover:bg-gray-50 cursor-pointer">
            <div className="font-semibold text-gray-900 text-sm">Coach Available</div>
            <p className="text-xs text-gray-600 mt-1">Coach Sarah is available for sessions this weekend</p>
            <span className="text-xs text-gray-400 mt-2 block">1 day ago</span>
          </div>
        </div>

        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold text-center block"
          >
            View All Messages
          </Link>
        </div>
      </div>
    </div>
  );
}
