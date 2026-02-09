import ExtrasPanel from '@/components/ExtrasPanel'
import AttendanceChartRecharts from '@/components/AttendanceChartRecharts'
import { getClubAttendance } from '@/actions/analytics'

export default async function AttendanceAnalyticsPage() {
  const clubAttendance = await getClubAttendance(90)
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-8 flex flex-col items-stretch w-full">
      <div className="w-full px-4 max-w-6xl mx-auto flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-green-800">Attendance Analytics</h1>
          <div className="text-sm text-gray-600">Club attendance overview</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AttendanceChartRecharts data={clubAttendance} />
          </div>
        </div>
      </div>
    </div>
  )
}
