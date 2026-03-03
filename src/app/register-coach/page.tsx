"use client"

import React, { useEffect, useState } from 'react'
import Button from '@/components/Button'
import { useToast } from '@/components/ToastProvider'
import { getAvailableCoaches, employCoach } from '@/actions/staff'
import ExtrasPanel from '@/components/ExtrasPanel'
import { Briefcase, Users, Trophy, Mail, Loader } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)
  const [employing, setEmploying] = useState<string | null>(null)
  const toast = useToast()

  async function load() {
    setLoading(true)
    try {
      const list = await getAvailableCoaches()
      setCoaches(list)
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
    setEmploying(coachId)
    try {
      await employCoach(actorId, coachId)
      toast.showToast('Coach employed successfully', 'success')
      await load()
    } catch (err: any) {
      toast.showToast('Failed to employ coach: ' + (err?.message || ''), 'error')
    } finally {
      setEmploying(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-sky-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Register a Coach
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Browse and employ available coaches to enhance your club's coaching staff.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-green-50 to-sky-50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Available</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{coaches.length}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Quality Staff</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">100%</p>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Professionals</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">✓</p>
            </div>
          </div>

          {/* Coaches List */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <Loader className="w-8 h-8 text-green-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading available coaches...</p>
              </div>
            ) : coaches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Coaches Available</h3>
                <p className="text-gray-600 text-center max-w-sm">
                  There are currently no coaches available for employment. Check back later or contact your administrator.
                </p>
              </div>
            ) : (
              coaches.map((coach) => (
                <div
                  key={coach.id}
                  className="p-6 sm:p-8 hover:bg-green-50 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  {/* Coach Info */}
                  <div className="flex-1">
                    <div className="mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{coach.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                          <Briefcase className="w-3 h-3" />
                          {coach.role || 'Coach'}
                        </span>
                        {coach.expertise && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            <Trophy className="w-3 h-3" />
                            {coach.expertise}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact Info */}
                    {coach.contact && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="break-all">{coach.contact}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleEmploy(coach.id)}
                    disabled={employing === coach.id}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      employing === coach.id
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {employing === coach.id && (
                      <Loader className="w-4 h-4 animate-spin" />
                    )}
                    {employing === coach.id ? 'Employing...' : 'Employ Coach'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Extras Panel */}
        <div className="mt-10">
          <ExtrasPanel />
        </div>
      </div>
    </div>
  )
}
