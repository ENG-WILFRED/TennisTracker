'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useFastQuery, useFastMutation } from '@/hooks/useFastQuery'

interface BugReport {
  id: string
  title: string
  description: string
  severity: string
  pageUrl: string
  userAgent: string
  status: string
  timestamp: string
  createdAt: string
  user: {
    firstName: string
    lastName: string
    email: string
    username: string
  }
}

export default function AdminBugsPage() {
  const [filter, setFilter] = useState('all')
  const { user } = useAuth()

  const queryKey = `bug-reports-${filter}`

  const { data, loading, error, refetch } = useFastQuery(
    queryKey,
    async () => {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)

      const response = await fetch(`/api/bugs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch bug reports')
      const data = await response.json()
      return data.bugReports || []
    },
    { enabled: true }
  )

  const updateBugMutation = useFastMutation(
    async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch('/api/bugs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })

      if (!response.ok) throw new Error('Failed to update bug status')
      const data = await response.json()
      return data.bugReport
    },
    {
      onSuccess: (updatedBug) => {
        // The cache will be invalidated automatically due to invalidateKeys
        console.log('Bug status updated:', updatedBug)
      },
      onError: (error) => {
        console.error('Error updating bug status:', error)
        alert('Failed to update bug status')
      },
      invalidateKeys: [queryKey] // Invalidate the current query
    }
  )

  const bugReports = data || []

  const updateBugStatus = async (bugId: string, newStatus: string) => {
    await updateBugMutation.mutate({ id: bugId, status: newStatus })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bug reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading bug reports</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bug Reports</h1>
          <p className="mt-2 text-gray-600">Manage user-submitted bug reports</p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Bug Reports List */}
        <div className="space-y-6">
          {bugReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🐛</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bug reports found</h3>
              <p className="text-gray-500">
                {filter === 'all' ? 'No bug reports have been submitted yet.' : `No ${filter} bug reports found.`}
              </p>
            </div>
          ) : (
            bugReports.map((bug: BugReport) => (
              <div key={bug.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{bug.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center">
                        👤 {bug.user.firstName} {bug.user.lastName} ({bug.user.username})
                      </span>
                      <span>📧 {bug.user.email}</span>
                      <span>🕒 {new Date(bug.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                        {bug.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
                        {bug.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <select
                    value={bug.status}
                    onChange={(e) => updateBugStatus(bug.id, e.target.value)}
                    className="ml-4 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{bug.description}</p>
                </div>

                <div className="bg-gray-50 rounded-md p-4 text-sm">
                  <h4 className="font-medium text-gray-900 mb-2">Technical Details</h4>
                  <div className="space-y-1 text-gray-600">
                    <div><strong>Page:</strong> <a href={bug.pageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{bug.pageUrl}</a></div>
                    <div><strong>Browser:</strong> {bug.userAgent.split(' ').pop()}</div>
                    <div><strong>Timestamp:</strong> {new Date(bug.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}