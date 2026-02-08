"use client"

import React, { useEffect, useState } from 'react'
import  Button  from '@/components/Button'
import { useToast } from '@/components/ToastProvider'
import { getAvailableCoaches, employCoach } from '@/actions/staff'
import ExtrasPanel from '@/components/ExtrasPanel'

type Coach = {
  id: string
  name: string
  role?: string | null
  expertise?: string | null
  employedById?: string | null
  contact?: string | null
}

export default function RegisterCoachPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function load() {
    setLoading(true)
    try {
      const list = await getAvailableCoaches()
      setCoaches(list as Coach[])
    } catch (err: any) {
        toast.showToast(err?.message || 'Failed to load coaches', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleEmploy(coachId: string) {
    const actorId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null
    setLoading(true)
    try {
      await employCoach(actorId, coachId)

      toast.showToast('Coach employed successfully', 'success')
      await load()
    } catch (err: any) {
        toast.showToast("Failed to employ coach " + err?.message || '', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-8 flex flex-col items-stretch w-full">
      <div className="w-full px-4 max-w-6xl mx-auto flex-1">
        <h1 className="text-2xl font-semibold mb-4 text-green-800">Register / Employ a Coach</h1>

        <p className="text-sm text-gray-600 mb-6">Select from available coaches and employ them to your club.</p>

        <div className="space-y-4">
        {loading && coaches.length === 0 ? (
          <div className="text-sm text-gray-500">Loading coaches…</div>
        ) : coaches.length === 0 ? (
          <div className="text-sm text-gray-500">No available coaches found.</div>
        ) : (
          coaches.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4 bg-white rounded shadow-sm">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-500">{c.role || 'Coach'} • {c.expertise || 'General'}</div>
                {c.contact ? <div className="text-sm text-gray-400">{c.contact}</div> : null}
              </div>
              <div>
                <Button onClick={() => handleEmploy(c.id)}>Employ</Button>
              </div>
            </div>
          ))
        )}
        </div>
        <div className="mt-6">
          <ExtrasPanel />
        </div>
      </div>
    </div>
  )
}
