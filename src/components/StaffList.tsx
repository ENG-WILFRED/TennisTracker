"use client"

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import Button from '@/components/Button'
import { useAuth } from '@/context/AuthContext'

type Props = { initialStaff: any[]; onUnemploy?: (actorId: string | null, coachId: string) => Promise<any> }

export default function StaffList({ initialStaff, onUnemploy }: Props) {
  const router = useRouter()
  const [staff, setStaff] = useState<any[]>(initialStaff || [])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { showToast } = useToast()
  let auth;
  try {
    auth = useAuth();
  } catch (e) {
    auth = { isLoggedIn: false } as any;
  }
  const { isLoggedIn } = auth;

  const roles = useMemo(() => Array.from(new Set((staff || []).map(s => s.role).filter(Boolean))), [staff])
  const filtered = useMemo(() => (staff || []).filter((s: any) => s.name.toLowerCase().includes(query.toLowerCase()) && (roleFilter ? s.role === roleFilter : true)), [staff, query, roleFilter])

  // Calculate statistics
  const totalStaff = staff.length
  const employedByMe = staff.filter(s => {
    if (typeof window === 'undefined') return false
    const actorId = localStorage.getItem('playerId')
    return s.employedById && actorId && s.employedById === actorId
  }).length
  const availableStaff = staff.filter(s => !s.employedById).length

  async function handleUnemployLocal(id: string) {
    const actorId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null
    try {
      if (!onUnemploy) throw new Error('Unemploy action not provided')
      await onUnemploy(actorId, id)
      showToast && showToast('Coach unemployed successfully', 'success')
      setStaff(prev => prev.map(s => s.id === id ? { ...s, employedById: null, employedBy: null } : s))
    } catch (err: any) {
      showToast && showToast(err?.message || 'Failed to unemploy', 'error')
    }
  }

  // Get role badge styling
  const getRoleBadge = (role: string) => {
    const roleStyles: Record<string, { bg: string; text: string; border: string }> = {
      'Head Coach': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      'Assistant Coach': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      'Fitness Coach': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      'Technical Coach': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    }
    
    const style = roleStyles[role] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
    return `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} border ${style.border}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative bg-gradient-to-r from-green-500 via-emerald-600 to-green-500 px-8 py-8 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm ring-2 ring-white/30">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-white mb-1">Staff Directory</h1>
                  <p className="text-green-100 text-sm font-medium">Manage and browse your coaching staff</p>
                </div>
              </div>
              
              <Button 
                onClick={() => router.push('/register-coach')}
                className="bg-white text-green-600 hover:bg-green-50 hover:scale-105 px-6 py-3 text-sm font-bold shadow-lg transition-all"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Coach
                </span>
              </Button>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="grid grid-cols-3 gap-6 px-8 py-6 bg-gray-50 border-b border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{totalStaff}</div>
              <div className="text-sm text-gray-500 uppercase tracking-wide">Total Staff</div>
            </div>
            <div className="text-center border-x border-gray-300">
              <div className="text-3xl font-bold text-green-600 mb-1">{employedByMe}</div>
              <div className="text-sm text-gray-500 uppercase tracking-wide">Employed by Me</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{availableStaff}</div>
              <div className="text-sm text-gray-500 uppercase tracking-wide">Available</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                placeholder="Search by name, role, or expertise..." 
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="sm:w-64 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <select 
                value={roleFilter} 
                onChange={e => setRoleFilter(e.target.value)} 
                className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none appearance-none bg-white text-sm font-medium"
              >
                <option value="">All Roles ({staff.length})</option>
                {roles.map((r: string) => (
                  <option key={r} value={r}>
                    {r} ({staff.filter(s => s.role === r).length})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-green-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white text-green-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-bold text-green-700">{filtered.length}</span> of <span className="font-semibold">{staff.length}</span> staff members
            </div>
            {(query || roleFilter) && (
              <button
                onClick={() => { setQuery(''); setRoleFilter('') }}
                className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Staff Grid/List */}
        {filtered.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filtered.map((s: any) => {
              const isEmployedByMe = typeof window !== 'undefined' && (() => {
                const actorId = localStorage.getItem('playerId')
                return s.employedById && actorId && s.employedById === actorId
              })()

              return viewMode === 'grid' ? (
                // Grid Card View
                <div 
                  key={s.id} 
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-green-300 hover:shadow-xl transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center mb-4">
                    {/* Avatar */}
                    <div className="relative mb-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white group-hover:ring-green-100 transition-all">
                        {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      {isEmployedByMe && (
                        <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-gray-900 text-xl mb-2 group-hover:text-green-600 transition-colors">
                      {s.name}
                    </h3>
                    
                    {/* Role Badge */}
                    <div className={getRoleBadge(s.role)}>
                      {s.role}
                    </div>

                    {/* Expertise */}
                    {s.expertise && (
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                        {s.expertise}
                      </div>
                    )}
                  </div>

                  {/* Contact */}
                  {s.contact && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      {isLoggedIn ? (
                        <button
                          onClick={() => router.push(`/contact?to=${encodeURIComponent(s.contact)}&title=${encodeURIComponent('Contact ' + s.name)}`)}
                          className="flex items-center justify-center gap-2 text-sm text-green-700 hover:text-green-800 font-medium group/email"
                        >
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="group-hover/email:underline truncate">{s.contact}</span>
                        </button>
                      ) : (
                        <a href="/login" className="flex items-center justify-center gap-2 text-sm text-green-700 hover:text-green-800 font-medium group/email">{s.contact}</a>
                      )}
                    </div>
                  )}

                  {/* Employed Status */}
                  {s.employedBy && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-800">
                        <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                        <span>
                          {isEmployedByMe ? 'Employed by you' : `Employed by ${s.employedBy.firstName || s.employedBy.username}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => router.push(`/coaches/${s.id}`)} 
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                    >
                      View Profile
                    </Button>
                    {isEmployedByMe && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleUnemployLocal(s.id)} 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                // List View
                <div 
                  key={s.id} 
                  className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-100 hover:border-green-300 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      {isEmployedByMe && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-green-600 transition-colors">
                            {s.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={getRoleBadge(s.role)}>
                              {s.role}
                            </span>
                            {s.expertise && (
                              <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                </svg>
                                {s.expertise}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => router.push(`/coaches/${s.id}`)} 
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 text-sm"
                          >
                            View Profile
                          </Button>
                          {isEmployedByMe && (
                            <Button 
                              variant="outline" 
                              onClick={() => handleUnemployLocal(s.id)} 
                              className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                            >
                              Un-employ
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Contact & Employment Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {s.contact && (
                          isLoggedIn ? (
                            <button
                              onClick={() => router.push(`/contact?to=${encodeURIComponent(s.contact)}&title=${encodeURIComponent('Contact ' + s.name)}`)}
                              className="flex items-center gap-1.5 text-green-700 hover:text-green-800 hover:underline"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {s.contact}
                            </button>
                          ) : (
                            <a href="/login" className="flex items-center gap-1.5 text-green-700 hover:text-green-800 hover:underline">{s.contact}</a>
                          )
                        )}
                        {s.employedBy && (
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                            {isEmployedByMe ? 'Employed by you' : `Employed by ${s.employedBy.firstName || s.employedBy.username}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Empty State
          <div className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300">
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-6 shadow-inner">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No staff members found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {query || roleFilter 
                  ? "Try adjusting your search or filters to find staff members" 
                  : "Get started by adding your first coach to the team"}
              </p>
              {(query || roleFilter) ? (
                <Button 
                  onClick={() => { setQuery(''); setRoleFilter('') }}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Clear All Filters
                </Button>
              ) : (
                <Button 
                  onClick={() => router.push('/register-coach')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 px-8 py-3"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add First Coach
                  </span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}