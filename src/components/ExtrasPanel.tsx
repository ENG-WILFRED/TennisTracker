"use client"

import React from 'react'
import Button from '@/components/Button'
import { announcements, events, tips } from '@/data/site'

export default function ExtrasPanel() {
  return (
    <aside className="bg-white rounded-lg p-4 shadow-sm">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-green-800">Announcements</h4>
        <ul className="mt-2 space-y-2 text-sm text-gray-600">
          {announcements.map(a => (
            <li key={a.id} className="border-l-4 border-green-100 pl-3">{a.title} • <span className="text-xs text-gray-400">{a.date}</span>
              <div className="text-gray-500">{a.body}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="text-lg font-semibold text-green-800">Upcoming Events</h4>
        <ul className="mt-2 space-y-2 text-sm text-gray-600">
          {events.map(ev => (
            <li key={ev.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{ev.title}</div>
                <div className="text-xs text-gray-400">{ev.date} • {ev.location}</div>
              </div>
              <Button onClick={() => window.alert('Event details coming soon')} variant="outline">View</Button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-green-800">Quick Tips</h4>
        <ul className="mt-2 space-y-2 text-sm text-gray-600">
          {tips.map(t => (
            <li key={t.id}>
              <div className="font-medium">{t.title}</div>
              <div className="text-gray-500 text-sm">{t.body}</div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
