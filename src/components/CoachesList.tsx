"use client"

import React, { useMemo, useState } from 'react'
import { useToast } from '@/components/ToastProvider'
import Button from '@/components/Button'

type Props = { initialCoaches: any[]; onEmploy?: (actorId: string | null, coachId: string) => Promise<any>; onUnemploy?: (actorId: string | null, coachId: string) => Promise<any> }

export default function CoachesList({ initialCoaches, onEmploy, onUnemploy }: Props) {
  const [coaches, setCoaches] = useState<any[]>(initialCoaches || [])
  const [query, setQuery] = useState('')
  const { showToast } = useToast()

  const filtered = useMemo(() => (coaches || []).filter(c => c.name.toLowerCase().includes(query.toLowerCase())), [coaches, query])

  async function handleUnemployLocal(id: string) {
    const actorId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null
    try {
      if (!onUnemploy) throw new Error('Unemploy action not provided')
      await onUnemploy(actorId, id)
      showToast && showToast('Coach unemployed', 'success')
      setCoaches(prev => prev.map(c => c.id === id ? { ...c, employedById: null, employedBy: null } : c))
    } catch (err: any) {
      showToast && showToast(err?.message || 'Failed to unemploy', 'error')
    }
  }

  async function handleEmployLocal(id: string) {
    const actorId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null
    try {
      if (!onEmploy) throw new Error('Employ action not provided')
      await onEmploy(actorId, id)
      showToast && showToast('Coach employed', 'success')
      setCoaches(prev => prev.map(c => c.id === id ? { ...c, employedById: actorId, employedBy: { id: actorId } } : c))
    } catch (err: any) {
      showToast && showToast(err?.message || 'Failed to employ', 'error')
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search coaches..." className="flex-1 border rounded-md px-3 py-2" />
        <Button onClick={() => { showToast && showToast('Opening employ coach form...', 'info'); window.location.href = '/register-coach'; }}>Employ a Coach</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="font-semibold text-green-800">{c.name}</div>
            <div className="text-sm text-gray-500">{c.role} · {c.expertise}</div>
            {c.employedBy ? <div className="text-xs text-gray-400 mt-2">Employed by: <span className="text-green-700">{c.employedBy.firstName || c.employedBy.username}</span></div> : null}
            <div className="mt-3 flex justify-between items-center">
              <a href={`mailto:${c.contact}`} className="px-3 py-1 rounded-md bg-white border border-green-200 text-green-700 text-sm">Contact</a>
              <div className="flex items-center gap-2">
                <Button onClick={() => showToast && showToast('Coaching request sent.', 'success')}>Request Coaching</Button>
                {typeof window !== 'undefined' && (() => {
                  const actorId = localStorage.getItem('playerId')
                  if (c.employedById && actorId && c.employedById === actorId) {
                    return <Button variant="outline" onClick={() => handleUnemployLocal(c.id)} className="text-sm">Un-employ</Button>
                  }
                  if (!c.employedById && actorId) {
                    return <Button onClick={() => handleEmployLocal(c.id)} className="text-sm">Employ</Button>
                  }
                  return null
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
