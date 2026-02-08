"use client"

import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Legend } from 'recharts'

export default function PerformanceChart({ data }: { data: { week: string; rating: number; points: number }[] }) {
  if (!data || data.length === 0) return <div className="bg-white rounded-lg p-4 shadow-sm">No performance data</div>

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-green-800 font-semibold">Performance (recent)</h3>
        <div className="text-sm text-gray-500">Last {data.length} weeks</div>
      </div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="week" tickFormatter={(w) => w.split('-')[1]} />
            <YAxis yAxisId="left" orientation="left" domain={[1000, 1500]} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax + 20']} />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="rating" stroke="#0ea5a3" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="points" stroke="#f97316" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-sm text-gray-500">Green line shows rating, orange shows weekly points.</div>
    </div>
  )
}
