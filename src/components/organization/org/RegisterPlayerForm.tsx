"use client";

import React, { useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

type PlayerOption = { id: string; name: string; username: string; img?: string; registered?: boolean };

export default function RegisterPlayerForm({ orgId, onRegistered, readOnly = false }: any) {
  const [playerId, setPlayerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<PlayerOption[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<PlayerOption[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const handleRegister = async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/register-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) {
        setPlayerId('');
        setQuery('');
        onRegistered?.();
        // refresh registered list
        fetchRegistered();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  async function fetchRegistered() {
    if (!orgId) return;
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/players`, { requireAuth: false });
      if (res.ok) {
        const data = (await res.json()) as any;
        const mapped = data.map((p: any) => ({ id: p.id, name: p.name, username: p.username, img: p.img }));
        setRegisteredPlayers(mapped);
        setRegisteredIds(new Set(mapped.map((p: { id: any; }) => p.id)));
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Failed to load registered players', err);
    }
  }

  useEffect(() => { fetchRegistered(); }, [orgId]);

  useEffect(() => {
    // debounce queries
    if (!query || query.trim().length === 0) {
      setOptions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const q = query.trim();
        const res = await fetch(`/api/players?query=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          setOptions(data.map((p: any) => ({ id: p.id, name: p.name, username: p.username, img: p.img, registered: registeredIds.has(p.id) })));
        } else {
          setOptions([]);
        }
      } catch (e) {
        console.error('Player search error', e);
        setOptions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query, registeredIds]);

  // when registeredIds changes, update any existing options to mark them
  useEffect(() => {
    if (options.length === 0) return;
    setOptions((prev) => prev.map((o) => ({ ...o, registered: registeredIds.has(o.id) })));
  }, [registeredIds]);

  function handleSelectOption(opt: PlayerOption) {
    setPlayerId(opt.id);
    setQuery(opt.name + ` (@${opt.username})`);
  }

  const selectedIsRegistered = !!options.find((o) => o.id === playerId && o.registered);

  // pagination for registered players
  const totalPlayers = registeredPlayers.length;
  const totalPages = Math.max(1, Math.ceil(totalPlayers / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = registeredPlayers.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Register Player</h3>
            <p className="text-blue-100 text-sm mt-0.5">Add a new member to your organization</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {readOnly ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm text-amber-800 font-medium">Please log in to register players</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPlayerId(''); }}
                onFocus={() => { /* Focus handler */ }}
                placeholder="Type to search players..."
                className="w-full p-2 mb-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {options.length === 0 ? (
              <div className="p-4 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 font-medium">No players found</p>
                <p className="mt-1 text-xs text-gray-500">Ask the user to register or try a different search</p>
              </div>
            ) : (
              <div className="py-2">
                {options.map((opt, idx) => (
                  <div 
                    key={opt.id} 
                    onClick={() => handleSelectOption(opt)} 
                    className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors flex items-center gap-3 ${idx !== options.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <img 
                      src={opt.img || '/default-avatar.png'} 
                      alt={opt.name} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{opt.name}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-500">@{opt.username}</div>
                        {opt.registered && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">Registered</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={handleRegister} 
              disabled={!playerId || loading || selectedIsRegistered} 
              className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Register Player</span>
                </>
              )}
            </button>
          </>
        )}

        {/* Registered players list with pagination (always visible) */}
        <div className="mt-6">
          {totalPlayers === 0 ? (
            <div className="text-center text-sm text-gray-500">No players are registered to this organization.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                {paginated.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border-2 border-blue-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={p.img || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                      <div>
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">@{p.username}</div>
                      </div>
                    </div>
                    <div className="text-sm text-green-700 font-medium">Registered</div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 flex items-center justify-between">
                  <div className="text-sm text-blue-900 font-medium">
                    Showing <span className="font-bold text-blue-700">{startIndex + 1}</span> to <span className="font-bold text-blue-700">{Math.min(startIndex + PAGE_SIZE, totalPlayers)}</span> of <span className="font-bold text-blue-700">{totalPlayers}</span> players
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1 rounded bg-white border border-blue-200 text-blue-700 disabled:opacity-40">First</button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 rounded bg-white border border-blue-200 text-blue-700 disabled:opacity-40">Prev</button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                        return (
                          <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-blue-700'}`}>{page}</button>
                        );
                      })}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded bg-white border border-blue-200 text-blue-700 disabled:opacity-40">Next</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 rounded bg-white border border-blue-200 text-blue-700 disabled:opacity-40">Last</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}