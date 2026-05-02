'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Users, AlertCircle, TrendingUp, Search, Filter, ChevronDown, Zap, Target, SlidersHorizontal } from 'lucide-react';

interface NearbyPerson {
  id: string;
  name: string;
  username: string;
  city: string;
  nationality: string;
  photo: string;
  wins: number;
  matchesPlayed: number;
  level: string;
  distance: number;
}

interface FindNearbyPeopleProps {
  onSelectPerson?: (person: NearbyPerson) => void;
  onMessageClick?: (personId: string, personName: string) => void;
  onChallengeClick?: (personId: string, personName: string) => void;
  radius?: number;
}

const AVAILABLE_LOCATIONS = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kericho', 'Naivasha', 'Uasin Gishu',
  'Kilifi', 'Lamu', 'Nyali', 'Diani', 'Bamburi', 'Likoni', 'Watamu', 'Malindi',
  'Pate Island', 'Shanzu', 'Ukunda'
];

const LOCATION_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  Nairobi: { latitude: -1.2866, longitude: 36.8172 },
  Mombasa: { latitude: -4.0435, longitude: 39.6682 },
  Kisumu: { latitude: -0.1019, longitude: 34.7680 },
  Nakuru: { latitude: -0.3031, longitude: 36.0803 },
  Eldoret: { latitude: 0.5143, longitude: 35.2799 },
  Kericho: { latitude: -0.3667, longitude: 35.2833 },
  Naivasha: { latitude: -0.7167, longitude: 36.4667 },
  'Uasin Gishu': { latitude: 0.9, longitude: 35.2 },
  Kilifi: { latitude: -3.6299, longitude: 39.8474 },
  Lamu: { latitude: -2.2833, longitude: 40.9 },
  Nyali: { latitude: -4.0291, longitude: 39.6676 },
  Diani: { latitude: -4.3184, longitude: 39.5794 },
  Bamburi: { latitude: -3.9830, longitude: 39.7030 },
  Likoni: { latitude: -4.1299, longitude: 39.6580 },
  Watamu: { latitude: -3.3847, longitude: 40.0289 },
  Malindi: { latitude: -3.2168, longitude: 40.1168 },
  'Pate Island': { latitude: -2.0500, longitude: 41.1500 },
  Shanzu: { latitude: -3.9600, longitude: 39.7500 },
  Ukunda: { latitude: -4.2950, longitude: 39.5420 },
};

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const GAMES_RANGES = ['0-5', '6-15', '16-30', '31+'];

const LEVEL_CONFIG: Record<string, { dot: string; text: string; bg: string }> = {
  Beginner:     { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  Intermediate: { dot: 'bg-lime-400',    text: 'text-lime-400',    bg: 'bg-lime-400/10'    },
  Advanced:     { dot: 'bg-green-300',   text: 'text-green-300',   bg: 'bg-green-300/10'   },
};

const inputBase =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 outline-none transition-all focus:border-[#7dc142]/50 focus:bg-white/[0.06]';

export const FindNearbyPeople: React.FC<FindNearbyPeopleProps> = ({
  onSelectPerson,
  onMessageClick,
  onChallengeClick,
  radius = 10,
}) => {
  const [nearbyPeople, setNearbyPeople] = useState<NearbyPerson[]>([]);
  const [suggestedPeople, setSuggestedPeople] = useState<NearbyPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [radiusKm, setRadiusKm] = useState(radius);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchMode, setSearchMode] = useState<'radius' | 'nearest' | 'location'>('radius');
  const [resultLabel, setResultLabel] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedGamesRange, setSelectedGamesRange] = useState('');
  const [sortByDistance, setSortByDistance] = useState<'closest' | 'farthest'>('closest');
  const [filterLocation, setFilterLocation] = useState('');

  const buildUrlParams = (options: {
    mode?: 'radius' | 'nearest' | 'location';
    latitude?: number; longitude?: number;
    radius?: number; query?: string; location?: string;
  }) => {
    const params = new URLSearchParams();
    const mode = options.mode || searchMode;
    const query = options.query ?? searchQuery;
    const location = options.location ?? searchLocation;
    const r = typeof options.radius === 'number' ? options.radius : radiusKm;
    params.set('limit', '50');
    params.set('mode', mode);
    if (query.trim()) params.set('query', query.trim());
    if (location.trim()) params.set('location', location.trim());
    if (mode === 'nearest') params.set('nearest', 'true');
    else if (mode === 'radius') params.set('radius', String(r));
    if (typeof options.latitude === 'number' && typeof options.longitude === 'number') {
      params.set('latitude', String(options.latitude));
      params.set('longitude', String(options.longitude));
    }
    return params.toString();
  };

  const getCacheKey = (mode: string, query: string, location: string, r: number) =>
    `FindNearbyPeople:${typeof window !== 'undefined' ? window.location.pathname : ''}:${mode}:${query}:${location}:${r}`;

  const loadInitialSearchFromUrl = () => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query') || '';
    const location = params.get('location') || '';
    const mode = (params.get('mode') as 'radius' | 'nearest' | 'location') ||
      (params.get('nearest') === 'true' ? 'nearest' : params.has('location') ? 'location' : 'radius');
    const r = Number(params.get('radius')) || radiusKm;
    if (!query && !location && !params.get('nearest') && !params.has('mode') && !params.has('radius')) return null;
    return { mode, query, location, radius: r };
  };

  const filteredAndSortedPeople = useMemo(() => {
    let filtered = [...nearbyPeople];
    if (selectedLevel) filtered = filtered.filter(p => p.level === selectedLevel);
    if (selectedGamesRange) {
      filtered = filtered.filter(p => {
        const g = p.matchesPlayed;
        if (selectedGamesRange === '0-5') return g <= 5;
        if (selectedGamesRange === '6-15') return g >= 6 && g <= 15;
        if (selectedGamesRange === '16-30') return g >= 16 && g <= 30;
        if (selectedGamesRange === '31+') return g >= 31;
        return true;
      });
    }
    if (filterLocation) filtered = filtered.filter(p => p.city === filterLocation);
    filtered.sort((a, b) => sortByDistance === 'closest' ? a.distance - b.distance : b.distance - a.distance);
    return filtered;
  }, [nearbyPeople, selectedLevel, selectedGamesRange, sortByDistance, filterLocation]);

  const availableLocations = useMemo(() =>
    Array.from(new Set(nearbyPeople.map(p => p.city))).sort(), [nearbyPeople]);

  const fetchNearbyPeople = async (
    mode: 'radius' | 'nearest' | 'location',
    overrides?: { query?: string; location?: string; radius?: number }
  ) => {
    const queryValue = overrides?.query ?? searchQuery;
    const locationValue = overrides?.location ?? searchLocation;
    const radiusValue = overrides?.radius ?? radiusKm;

    setSearchMode(mode);
    setSearchQuery(queryValue);
    setSearchLocation(locationValue);
    setRadiusKm(radiusValue);
    setLoading(true); setError(null); setSuggestedPeople([]); setHasSearched(true); setResultLabel('');
    setSelectedLevel(''); setSelectedGamesRange(''); setSortByDistance('closest'); setFilterLocation('');

    const performSearch = async (latitude?: number, longitude?: number) => {
      try {
        const urlParams = buildUrlParams({ mode, latitude, longitude, radius: radiusValue, query: queryValue, location: locationValue });
        const response = await fetch(`/api/players/nearby?${urlParams}`);
        if (!response.ok) throw new Error('Search failed.');
        const data: NearbyPerson[] = await response.json();
        setNearbyPeople(data);
        const label = data.length > 0
          ? mode === 'nearest' ? 'Nearest players' : mode === 'location' ? 'Location results' : `Within ${radiusValue} km`
          : mode === 'radius' && latitude !== undefined ? `No players within ${radiusValue} km` : 'No players found';
        setResultLabel(label);
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `${window.location.pathname}?section=find-people&${urlParams}`);
          window.sessionStorage.setItem(getCacheKey(mode, queryValue, locationValue, radiusValue), JSON.stringify({ nearbyPeople: data, suggestedPeople: [], resultLabel: label }));
        }
        if (data.length === 0 && mode === 'radius' && latitude !== undefined) {
          const suggestData: NearbyPerson[] = await (await fetch(`/api/players/nearby?${buildUrlParams({ mode: 'nearest', latitude, longitude, query: queryValue, location: locationValue })}`)).json();
          setSuggestedPeople(suggestData.slice(0, 10));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch players');
      } finally {
        setLoading(false);
      }
    };

    if (mode === 'location') {
      if (!locationValue.trim() && !queryValue.trim()) { setError('Enter a location or search term.'); setLoading(false); return; }
      const fb = locationValue.trim() ? LOCATION_COORDINATES[locationValue.trim()] : undefined;
      if (!navigator.geolocation) { if (fb) { performSearch(fb.latitude, fb.longitude); return; } setError('Geolocation not supported.'); setLoading(false); return; }
      navigator.geolocation.getCurrentPosition(
        pos => performSearch(pos.coords.latitude, pos.coords.longitude),
        () => { if (fb) { performSearch(fb.latitude, fb.longitude); return; } setError('Location access denied.'); setLoading(false); }
      ); return;
    }
    if (!navigator.geolocation) { setError('Geolocation not supported.'); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => performSearch(pos.coords.latitude, pos.coords.longitude),
      err => { setError(`Location access denied: ${err.message}`); setLoading(false); }
    );
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const init = loadInitialSearchFromUrl();
    if (!init) return;
    const { mode, query, location, radius: r } = init;
    setSearchMode(mode); setSearchQuery(query); setSearchLocation(location); setRadiusKm(r); setHasSearched(true);
    const cached = window.sessionStorage.getItem(getCacheKey(mode, query, location, r));
    if (cached) {
      try {
        const p = JSON.parse(cached);
        setNearbyPeople(p.nearbyPeople || []); setSuggestedPeople(p.suggestedPeople || []); setResultLabel(p.resultLabel || ''); return;
      } catch {}
    }
    fetchNearbyPeople(mode, { query, location, radius: r });
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const lvlCfg = (level: string) => LEVEL_CONFIG[level] || LEVEL_CONFIG.Beginner;

  const selectCls = `${inputBase} px-3 py-2.5 appearance-none cursor-pointer`;

  return (
    <div className="w-full text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-[#7dc142]" />
          <h2 className="text-sm font-semibold tracking-widest uppercase text-white/70">Find Players Near You</h2>
        </div>
        {loading && <span className="w-1.5 h-1.5 rounded-full bg-[#7dc142] animate-pulse" />}
      </div>

      {/* Search inputs */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
          <input
            className={`${inputBase} pl-9 pr-3 py-2.5`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Name, city, level…"
          />
        </div>
        <div className="relative">
          <select className={selectCls} value={searchLocation} onChange={e => setSearchLocation(e.target.value)}>
            <option value="">Location…</option>
            {AVAILABLE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <input
            type="number" min={1} max={200} value={radiusKm}
            onChange={e => setRadiusKm(Number(e.target.value))}
            className={`${inputBase} w-24 px-3 py-2.5 text-center`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/25 pointer-events-none">km</span>
        </div>
        <span className="text-white/20 text-xs">radius</span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <button
          onClick={() => fetchNearbyPeople('radius')} disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#7dc142] hover:bg-[#8dd152] text-[#071207] text-xs font-bold tracking-wide uppercase transition-all disabled:opacity-50 col-span-1"
        >
          <Target className="w-3.5 h-3.5" />
          {loading ? 'Searching…' : `${radiusKm} km`}
        </button>
        <button
          onClick={() => fetchNearbyPeople('nearest')} disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-white/70 hover:text-white text-xs font-semibold tracking-wide uppercase transition-all disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Nearest
        </button>
        <button
          onClick={() => fetchNearbyPeople('location')} disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-white/70 hover:text-white text-xs font-semibold tracking-wide uppercase transition-all disabled:opacity-50"
        >
          <MapPin className="w-3.5 h-3.5" />
          By city
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="space-y-3">
          {/* Result label + filter toggle */}
          {(resultLabel || nearbyPeople.length > 0) && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">
                {resultLabel}
                {filteredAndSortedPeople.length !== nearbyPeople.length && nearbyPeople.length > 0 &&
                  <span className="ml-1 text-[#7dc142]">· {filteredAndSortedPeople.length} shown</span>}
              </span>
              {nearbyPeople.length > 0 && (
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${showFilters ? 'text-[#7dc142]' : 'text-white/30 hover:text-white/60'}`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filter
                </button>
              )}
            </div>
          )}

          {/* Filter panel */}
          {showFilters && nearbyPeople.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              {[
                { label: 'Level', value: selectedLevel, onChange: setSelectedLevel, options: LEVELS.map(l => ({ v: l, t: l })) },
                { label: 'Games', value: selectedGamesRange, onChange: setSelectedGamesRange, options: GAMES_RANGES.map(r => ({ v: r, t: r + ' games' })) },
                { label: 'Sort', value: sortByDistance, onChange: (v: string) => setSortByDistance(v as 'closest' | 'farthest'), options: [{ v: 'closest', t: 'Closest' }, { v: 'farthest', t: 'Farthest' }] },
                { label: 'City', value: filterLocation, onChange: setFilterLocation, options: availableLocations.map(l => ({ v: l, t: l })) },
              ].map(({ label, value, onChange, options }) => (
                <div key={label} className="relative">
                  <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">{label}</label>
                  <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-md text-xs text-white/80 px-2.5 py-2 appearance-none outline-none focus:border-[#7dc142]/40 cursor-pointer"
                  >
                    <option value="">All</option>
                    {options.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 bottom-2.5 w-3 h-3 text-white/20 pointer-events-none" />
                </div>
              ))}
            </div>
          )}

          {/* Player cards */}
          {filteredAndSortedPeople.length > 0 ? (
            <div className="space-y-px">
              {filteredAndSortedPeople.map((person, i) => {
                const lc = lvlCfg(person.level);
                return (
                  <div
                    key={person.id}
                    onClick={() => onSelectPerson?.(person)}
                    className={`flex items-center gap-3 px-3 py-3 hover:bg-white/[0.04] transition-colors ${i === 0 ? 'rounded-t-lg' : ''} ${i === filteredAndSortedPeople.length - 1 ? 'rounded-b-lg' : ''} ${onSelectPerson ? 'cursor-pointer' : ''}`}
                  >
                    {/* Avatar */}
                    <img src={person.photo} alt={person.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white leading-none">{person.name}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${lc.bg} ${lc.text}`}>
                          <span className={`w-1 h-1 rounded-full ${lc.dot}`} />
                          {person.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-white/30">@{person.username}</span>
                        <span className="text-white/15 text-xs">·</span>
                        <span className="text-xs text-white/30">{person.city}</span>
                        <span className="text-white/15 text-xs">·</span>
                        <span className="text-xs text-white/30">{person.wins}W · {person.matchesPlayed} matches</span>
                      </div>
                    </div>

                    {/* Distance + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold text-[#7dc142]">{person.distance.toFixed(1)} km</span>
                      {(onMessageClick || onChallengeClick) && (
                        <div className="flex gap-1.5">
                          {onMessageClick && (
                            <button
                              onClick={e => { e.stopPropagation(); onMessageClick(person.id, person.name); }}
                              className="px-2.5 py-1.5 rounded-md bg-[#7dc142] hover:bg-[#8dd152] text-[#071207] text-xs font-bold uppercase tracking-wide transition-all"
                            >
                              DM
                            </button>
                          )}
                          {onChallengeClick && (
                            <button
                              onClick={e => { e.stopPropagation(); onChallengeClick(person.id, person.name); }}
                              className="px-2.5 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wide transition-all"
                            >
                              ⚡
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : suggestedPeople.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 px-3 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <TrendingUp className="w-4 h-4 text-[#7dc142] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white/70">No players within {radiusKm} km</p>
                  <p className="text-xs text-white/30 mt-0.5">Showing nearest players outside your radius.</p>
                </div>
              </div>
              <div className="space-y-px">
                {suggestedPeople.map((person, i) => {
                  const lc = lvlCfg(person.level);
                  return (
                    <div key={person.id} className={`flex items-center gap-3 px-3 py-3 hover:bg-white/[0.04] transition-colors ${i === 0 ? 'rounded-t-lg' : ''} ${i === suggestedPeople.length - 1 ? 'rounded-b-lg' : ''}`}>
                      <img src={person.photo} alt={person.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{person.name}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${lc.bg} ${lc.text}`}>
                            <span className={`w-1 h-1 rounded-full ${lc.dot}`} />{person.level}
                          </span>
                        </div>
                        <span className="text-xs text-white/30">{person.city}</span>
                      </div>
                      <span className="text-xs font-semibold text-white/40">{person.distance.toFixed(1)} km</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : hasSearched && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-white/20" />
              </div>
              <p className="text-sm font-medium text-white/30">No players found</p>
              <p className="text-xs text-white/20 mt-1">Try a wider radius or nearest search</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};