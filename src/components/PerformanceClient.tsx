"use client"

import React, { useEffect, useMemo, useState } from 'react'
import PerformanceChart from '@/components/PerformanceChart'

type Player = { id: string; firstName: string; lastName: string }

export default function PerformanceClient({ players, getPlayerPerformance }: { players: Player[]; getPlayerPerformance: (playerId: string) => Promise<any[]> }) {
  const [selected, setSelected] = useState<string>(players[0]?.id || '')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    getPlayerPerformance(selected).then((d) => setData(d || [])).finally(() => setLoading(false))
  }, [selected, getPlayerPerformance])

  const displayName = useMemo(() => {
    const p = players.find((x) => x.id === selected)
    return p ? `${p.firstName} ${p.lastName}` : ''
  }, [players, selected])

  return (
    <>
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Select player to view recent performance</div>
          <div className="text-lg font-semibold text-green-800">{displayName}</div>
        </div>
        <div>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="border rounded-md px-3 py-2">
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        {loading ? <div className="p-6">Loading performance…</div> : <PerformanceChart data={data} />}
      </div>
    </>
  )
}
