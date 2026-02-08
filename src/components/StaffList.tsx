"use client"

import React, { useMemo, useState } from 'react'
import { useToast } from '@/components/ToastProvider'
import Button from '@/components/Button'
// onUnemploy should be a server action passed from a parent server component
type Props = { initialStaff: any[]; onUnemploy?: (actorId: string | null, coachId: string) => Promise<any> }

export default function StaffList({ initialStaff, onUnemploy }: Props) {
  const [staff, setStaff] = useState<any[]>(initialStaff || [])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const { showToast } = useToast()

  const roles = useMemo(() => Array.from(new Set((staff || []).map(s => s.role).filter(Boolean))), [staff])
  const filtered = useMemo(() => (staff || []).filter((s: any) => s.name.toLowerCase().includes(query.toLowerCase()) && (roleFilter ? s.role === roleFilter : true)), [staff, query, roleFilter])

  async function handleUnemployLocal(id: string) {
    const actorId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null
    try {
      if (!onUnemploy) throw new Error('Unemploy action not provided')
      await onUnemploy(actorId, id)
      showToast && showToast('Coach unemployed', 'success')
      setStaff(prev => prev.map(s => s.id === id ? { ...s, employedById: null, employedBy: null } : s))
    } catch (err: any) {
      showToast && showToast(err?.message || 'Failed to unemploy', 'error')
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search staff..." className="flex-1 border rounded-md px-3 py-2" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded-md px-3 py-2">
          <option value="">All roles</option>
          {roles.map((r: string) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s: any) => (
          <div key={s.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="font-semibold text-green-800">{s.name}</div>
                <div className="text-sm text-gray-500">{s.role} · {s.expertise}</div>
                {s.contact ? <div className="text-sm text-gray-500 mt-2">Contact: <a href={`mailto:${s.contact}`} className="text-green-700">{s.contact}</a></div> : null}
                {s.employedBy ? <div className="text-xs text-gray-400 mt-2">Employed by: <span className="text-green-700">{s.employedBy.firstName || s.employedBy.username}</span></div> : null}
              </div>
              <div className="text-sm">
                <div className="flex flex-col items-end gap-2">
                  <Button onClick={() => showToast && showToast('Opening profile...', 'info')} variant="outline">Profile</Button>
                  {typeof window !== 'undefined' && (() => {
                    const actorId = localStorage.getItem('playerId')
                    if (s.employedById && actorId && s.employedById === actorId) {
                      return <Button variant="outline" onClick={() => handleUnemployLocal(s.id)} className="text-sm">Un-employ</Button>
                    }
                    return null
                  })()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
