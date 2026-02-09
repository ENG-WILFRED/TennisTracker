import ExtrasPanel from '@/components/ExtrasPanel'
import PerformanceClient from '@/components/PerformanceClient'
import { getRecentPlayersForSelector, getPlayerPerformance } from '@/actions/analytics'
import { TrendingUp, BarChart3, Users } from 'lucide-react'

export default async function PerformanceAnalyticsPage() {
  const players = await getRecentPlayersForSelector()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Performance Analytics</h1>
                <p className="text-sm text-slate-600 mt-0.5">Track and analyze player metrics</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg px-4 py-2 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs text-emerald-600 font-medium">Players Tracked</div>
                    <div className="text-lg font-bold text-emerald-700">{players.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Analytics Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Performance Overview</h2>
                </div>
              </div>
              <div className="p-6">
                <PerformanceClient
                  players={players}
                  getPlayerPerformance={getPlayerPerformance}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">

              {/* Additional Info Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20 p-6 text-white">
                <h3 className="font-semibold text-lg mb-2">Analytics Insights</h3>
                <p className="text-sm text-emerald-50 leading-relaxed">
                  Monitor real-time performance metrics and track player progression over time.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}