"use client";

import React, { useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useAuth } from '@/context/AuthContext';

export default function OrganizationList({ orgs, onSelect, onRefresh }: any) {
  const { isLoggedIn } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const res = await authenticatedFetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city }),
      });
      if (res.ok) {
        setName('');
        setCity('');
        setShowCreate(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-700">Clubs & Orgs</h2>
        {isLoggedIn ? (
          <button onClick={() => setShowCreate(!showCreate)} className="text-sm text-blue-600">New</button>
        ) : (
          <div className="text-xs text-gray-500">Log in to create</div>
        )}
      </div>

      {showCreate && isLoggedIn && (
        <div className="mb-4">
          <input className="w-full mb-2 p-2 border rounded" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full mb-2 p-2 border rounded" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white rounded">Create</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {orgs.map((org: any) => (
          <div key={org.id} onClick={() => onSelect(org)} className="p-2 rounded hover:bg-blue-50 cursor-pointer flex items-center justify-between">
            <div>
              <div className="font-semibold text-blue-800">{org.name}</div>
              <div className="text-xs text-gray-600">{org.city || org.country}</div>
            </div>
            <div className="text-xs text-gray-500">Manage</div>
          </div>
        ))}
      </div>
    </div>
  );
}
