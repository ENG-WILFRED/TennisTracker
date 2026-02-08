import ExtrasPanel from '@/components/ExtrasPanel'
import PerformanceClient from '@/components/PerformanceClient'
import { getRecentPlayersForSelector, getPlayerPerformance } from '@/actions/analytics'

export default async function PerformanceAnalyticsPage() {
  const players = await getRecentPlayersForSelector()
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-8 flex flex-col items-stretch w-full">
      <div className="w-full px-4 max-w-6xl mx-auto flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-green-800">Performance Analytics</h1>
          <div className="text-sm text-gray-600">Player performance overview</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PerformanceClient players={players} getPlayerPerformance={getPlayerPerformance} />
          </div>
          <aside className="lg:col-span-1">
            <ExtrasPanel />
          </aside>
        </div>
      </div>
    </div>
  )
}
