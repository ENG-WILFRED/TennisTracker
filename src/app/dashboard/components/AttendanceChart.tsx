import React from 'react';

export default function AttendanceChart({ attendance }: { attendance: any[] }) {
  // attendance: [{ date: '2026-01-01', present: true }, ...]
  if (!attendance || attendance.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-green-800 font-semibold">Attendance</h3>
          <div className="text-sm text-gray-500">Last 12</div>
        </div>
        <div className="text-gray-500">No attendance data available.</div>
      </div>
    );
  }

  // Build simple sparkline-like bars for last 12 entries
  const last = attendance.slice(-12);
  const values = last.map((a) => (a.present ? 1 : 0));

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-green-800 font-semibold">Attendance</h3>
        <div className="text-sm text-gray-500">Last {values.length}</div>
      </div>

      <div className="flex items-end gap-2 h-20">
        {values.map((v, i) => (
          <div key={i} className={`w-3 rounded-sm ${v ? 'bg-green-500' : 'bg-gray-200'}`} style={{ height: `${v ? 100 : 20}%` }} />
        ))}
      </div>

      <div className="mt-3 text-sm text-gray-500">Green = present, gray = absent.</div>
    </div>
  );
}
