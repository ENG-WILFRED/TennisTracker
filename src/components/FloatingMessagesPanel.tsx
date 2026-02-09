"use client"

import React, { useState } from 'react'
import Button from '@/components/Button'
import { announcements, events, tips } from '@/data/site'
import { useAuth } from '@/context/AuthContext'

export default function FloatingMessagesPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { isLoggedIn } = useAuth()

  // Don't render for non-logged-in users
  if (!isLoggedIn) {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 hover:from-green-700 hover:to-emerald-700"
        title="Messages & Announcements"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {/* Notification Badge */}
        {(announcements.length > 0 || events.length > 0) && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {announcements.length + events.length}
          </span>
        )}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <>
          {/* Overlay to close */}
          <div
            className="fixed inset-0 z-30 bg-black/70"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed bottom-24 right-6 z-40 w-full md:w-[500px] max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Messages & Announcements</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded-md transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="max-h-96 overflow-y-auto">
              {/* Announcements */}
              {announcements.length > 0 && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882m0 0a2 2 0 100 4 2 2 0 000-4zm0 0C6.5 7 4 9.239 4 12c0 .341.025.671.07 1H4c-2.21 0-4 1.343-4 3s1.79 3 4 3h7m6-10c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
                    </svg>
                    Announcements
                  </h4>
                  <ul className="space-y-3">
                    {announcements.map(a => (
                      <li key={a.id} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                        <div className="font-semibold text-gray-900 text-sm">{a.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{a.date}</div>
                        <div className="text-gray-600 text-sm mt-2">{a.body}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Events */}
              {events.length > 0 && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upcoming Events
                  </h4>
                  <ul className="space-y-3">
                    {events.map(ev => (
                      <li key={ev.id} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
                        <div className="font-semibold text-gray-900 text-sm">{ev.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          <div>{ev.date}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {ev.location}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {tips.length > 0 && (
                <div className="px-6 py-4">
                  <h4 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5h.01" />
                    </svg>
                    Quick Tips
                  </h4>
                  <ul className="space-y-3">
                    {tips.map(t => (
                      <li key={t.id} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
                        <div className="font-semibold text-gray-900 text-sm">{t.title}</div>
                        <div className="text-gray-600 text-sm mt-2">{t.body}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
