import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function AttendanceChart({ attendance }: { attendance: any[] }) {
  const router = useRouter();

  // Calculate statistics
  const totalDays = attendance?.length || 0;
  const presentDays = attendance?.filter(a => a.present).length || 0;
  const absentDays = totalDays - presentDays;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Get recent streak
  const getCurrentStreak = () => {
    if (!attendance || attendance.length === 0) return 0;
    let streak = 0;
    for (let i = attendance.length - 1; i >= 0; i--) {
      if (attendance[i].present) streak++;
      else break;
    }
    return streak;
  };

  const currentStreak = getCurrentStreak();

  if (!attendance || attendance.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Attendance Tracker</h3>
                <p className="text-green-100 text-xs">Track your training sessions</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/analytics/attendance')} 
              className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 text-sm font-semibold shadow-md"
            >
              View Details
            </Button>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-6 text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h4 className="text-gray-700 font-semibold mb-2">No Attendance Data</h4>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Start tracking your training sessions to see your attendance patterns and progress.
          </p>
        </div>
      </div>
    );
  }

  // Build visualization for last 30 entries
  const last = attendance.slice(-30);
  const values = last.map((a) => ({
    date: a.date,
    present: a.present
  }));

  // Get attendance level color
  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceLabel = (rate: number) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Attendance Tracker</h3>
              <p className="text-green-100 text-xs">Last {last.length} training sessions</p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/analytics/attendance')} 
            className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 text-sm font-semibold shadow-md"
          >
            View All
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {attendanceRate}%
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Attendance Rate
          </div>
          <div className={`text-xs font-semibold mt-1 ${getAttendanceColor(attendanceRate)}`}>
            {getAttendanceLabel(attendanceRate)}
          </div>
        </div>
        <div className="text-center border-x border-gray-200">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {presentDays}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Days Present
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {currentStreak}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Current Streak
          </div>
          {currentStreak > 0 && (
            <div className="text-xs text-orange-600 font-semibold mt-1">
              🔥 Keep it up!
            </div>
          )}
        </div>
      </div>

      {/* Visualization */}
      <div className="p-6">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h4>
          
          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-1 h-32 mb-3">
            {values.map((v, i) => {
              const isRecent = i >= values.length - 7;
              return (
                <div 
                  key={i} 
                  className="flex-1 flex flex-col items-center group relative"
                >
                  <div 
                    className={`w-full rounded-t-md transition-all duration-200 ${
                      v.present 
                        ? isRecent 
                          ? 'bg-gradient-to-t from-green-500 to-green-400 group-hover:from-green-600 group-hover:to-green-500' 
                          : 'bg-green-300 group-hover:bg-green-400'
                        : 'bg-gray-200 group-hover:bg-gray-300'
                    }`}
                    style={{ height: `${v.present ? 100 : 25}%` }}
                  />
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                      <div className="font-semibold">
                        {new Date(v.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className={v.present ? 'text-green-400' : 'text-red-400'}>
                        {v.present ? '✓ Present' : '✗ Absent'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-gray-600 font-medium">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-200"></div>
              <span className="text-gray-600 font-medium">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-400"></div>
              <span className="text-gray-600 font-medium">Recent (Last 7)</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-green-600">{attendanceRate}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{presentDays} present</span>
            <span>{absentDays} absent</span>
          </div>
        </div>

        {/* Quick Stats */}
        {currentStreak >= 5 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
            <div className="text-2xl">🏆</div>
            <div>
              <div className="font-semibold text-orange-900 text-sm">
                Amazing streak!
              </div>
              <div className="text-xs text-orange-700">
                You've attended {currentStreak} consecutive sessions
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}