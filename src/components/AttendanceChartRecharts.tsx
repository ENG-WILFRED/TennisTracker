"use client"

import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function AttendanceChartRecharts({ data }: { data: { date: string; present?: boolean; count?: number }[] }) {
  if (!data || data.length === 0) return <div className="bg-white rounded-lg p-4 shadow-sm">No attendance data</div>

  const chartData = data.map(d => ({ date: d.date, value: d.count ?? (d.present ? 1 : 0) }))

  const maxVal = Math.max(...chartData.map(c => c.value), 1)

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-green-800 font-semibold">Club Attendance (recent)</h3>
        <div className="text-sm text-gray-500">Last {chartData.length} days</div>
      </div>
      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} minTickGap={20} />
            <YAxis domain={[0, Math.ceil(maxVal)]} />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip formatter={(v:any) => v ? 'Present' : 'Absent'} />
            <Area type="monotone" dataKey="value" stroke="#10B981" fillOpacity={1} fill="url(#colorUv)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-sm text-gray-500">Higher area indicates more attendees on that day.</div>
    </div>
  )
}
