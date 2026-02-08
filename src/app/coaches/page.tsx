import { getCoaches, employCoach, unemployCoach } from '@/actions/staff';
import CoachesList from '@/components/CoachesList';
import ExtrasPanel from '@/components/ExtrasPanel';

export default async function CoachesPage() {
  const coaches = await getCoaches();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-8 flex flex-col items-stretch w-full">
      <div className="w-full px-4 max-w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-green-800">Coaches</h1>
          <div className="text-sm text-gray-600">Browse available coaches and contact them</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <CoachesList initialCoaches={coaches} onEmploy={employCoach} onUnemploy={unemployCoach} />
        </div>
        <div className="mt-6">
          <ExtrasPanel />
        </div>
      </div>
    </div>
  )
}
