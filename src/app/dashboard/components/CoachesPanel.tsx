import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function CoachesPanel({ coaches }: { coaches: any[] }) {
  const router = useRouter();
  const list = (coaches && coaches.length > 0) ? coaches : [];

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
        <h3 className="text-green-800 font-semibold">Coaches</h3>
        <Button onClick={() => router.push('/register-coach')} className="text-sm px-3 py-1">Employ</Button>
      </div>

      {(!list || list.length === 0) ? (
        <div className="text-gray-500">No coaches available. Employ a coach to get training assistance.</div>
      ) : (
        <ul className="space-y-2">
          {list.slice(0,6).map((c: any) => (
            <li key={c.id} className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-green-800">{c.name}</div>
                <div className="text-sm text-gray-500">{c.role} · {c.expertise || 'General coach'}</div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`mailto:${c.contact || ''}`} className="px-3 py-1 rounded-md bg-white border border-green-200 text-green-700 text-sm">Contact</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
