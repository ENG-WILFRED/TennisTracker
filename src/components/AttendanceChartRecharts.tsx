"use client"

import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function AttendanceChartRecharts({ data }: { data: { date: string; present?: boolean; count?: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-sky-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Data</h3>
          <p className="text-gray-500 text-sm">Attendance records will appear here once recorded</p>
        </div>
      </div>
    )
  }

  const chartData = data.map(d => ({ 
    date: d.date, 
    value: d.count ?? (d.present ? 1 : 0),
    displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  const maxVal = Math.max(...chartData.map(c => c.value), 1)
  const totalAttendance = chartData.reduce((sum, item) => sum + item.value, 0)
  const avgAttendance = (totalAttendance / chartData.length).toFixed(1)
  const peakAttendance = maxVal

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-xl border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-1">{payload[0].payload.displayDate}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full"></div>
            <p className="text-sm text-gray-700">
              <span className="font-bold text-green-700">{payload[0].value}</span> {payload[0].value === 1 ? 'attendee' : 'attendees'}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-sky-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Club Attendance</h3>
              <p className="text-sm text-gray-600">Last {chartData.length} days</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Active</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 px-6 py-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
        <div className="text-center p-3 bg-white rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-green-700">{totalAttendance}</div>
          <div className="text-xs text-gray-600 mt-1 font-medium">Total</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-blue-700">{avgAttendance}</div>
          <div className="text-xs text-gray-600 mt-1 font-medium">Average</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-purple-700">{peakAttendance}</div>
          <div className="text-xs text-gray-600 mt-1 font-medium">Peak</div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-6 py-6">
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="50%" stopColor="#059669" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={{ stroke: '#D1D5DB' }}
                axisLine={{ stroke: '#D1D5DB' }}
              />
              <YAxis 
                domain={[0, Math.ceil(maxVal * 1.1)]}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={{ stroke: '#D1D5DB' }}
                axisLine={{ stroke: '#D1D5DB' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#10B981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAttendance)"
                activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-sky-50 border-t border-gray-100">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold">Track attendance trends:</span> Higher peaks indicate more attendees. Use this data to identify popular training days and optimize scheduling.
          </p>
        </div>
      </div>
    </div>
  )
}