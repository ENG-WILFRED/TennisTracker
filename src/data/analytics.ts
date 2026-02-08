// Sample analytics data used for charts (seed-like, not DB-backed)

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function daysBack(n: number) {
  const arr: { date: string; present: boolean; playerId?: string }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    arr.push({ date: formatDate(d), present: Math.random() > 0.2 })
  }
  return arr
}

export const clubAttendance = daysBack(60) // last 60 days

export const playerPerformance = (playerId: string) => {
  const data: { week: string; rating: number; points: number }[] = []
  for (let i = 23; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    const weekNum = Math.ceil(((d.getTime() - new Date(d.getFullYear(),0,1).getTime()) / (1000*60*60*24) + new Date(d.getFullYear(),0,1).getDay()+1)/7)
    const week = `${d.getFullYear()}-${String(weekNum).padStart(2,'0')}`
    const rating = Math.round(1200 + Math.sin(i / 3) * 120 + Math.random() * 60)
    const points = Math.max(0, Math.round(50 + Math.cos(i / 4) * 40 + Math.random() * 40))
    data.push({ week, rating, points })
  }
  return data
}

export const samplePlayers = [
  { id: 'p1', firstName: 'Julius', lastName: 'Nyerere' },
  { id: 'p2', firstName: 'Joe', lastName: 'Kazungu' },
  { id: 'p3', firstName: 'Leah', lastName: 'Crush' },
]
