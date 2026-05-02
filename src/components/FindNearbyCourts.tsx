'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Home, AlertCircle, TrendingUp, Search, ChevronDown, Zap, Target, SlidersHorizontal } from 'lucide-react';

interface NearbyCourt {
  id: string;
  name: string;
  address: string;
  city: string;
  surface: string;
  lights: boolean;
  indoorOutdoor: string;
  image: string;
  organization: string;
  organizationLogo: string;
  distance: number;
}

interface FindNearbyCourtsProps {
  onSelectCourt?: (court: NearbyCourt) => void;
  onBookClick?: (courtId: string, courtName: string) => void;
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

const SURFACES = ['Clay', 'Hard', 'Grass', 'Carpet'];
const INDOOR_OUTDOOR = ['Indoor', 'Outdoor'];

const SURFACE_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Clay:   { bg: 'bg-orange-400/10',  text: 'text-orange-400', dot: 'bg-orange-400' },
  Hard:   { bg: 'bg-blue-400/10',    text: 'text-blue-400',   dot: 'bg-blue-400'   },
  Grass:  { bg: 'bg-emerald-400/10', text: 'text-emerald-400',dot: 'bg-emerald-400' },
  Carpet: { bg: 'bg-purple-400/10',  text: 'text-purple-400', dot: 'bg-purple-400' },
};

const inputBase =
  'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 outline-none transition-all focus:border-[#7dc142]/50 focus:bg-white/[0.06]';

export const FindNearbyCourts: React.FC<FindNearbyCourtsProps> = ({
  onSelectCourt,
  onBookClick,
  radius = 10,
}) => {
  const [nearbyCourts, setNearbyCourts] = useState<NearbyCourt[]>([]);
  const [suggestedCourts, setSuggestedCourts] = useState<NearbyCourt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [radiusKm, setRadiusKm] = useState(radius);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchMode, setSearchMode] = useState<'radius' | 'nearest' | 'location'>('radius');
  const [resultLabel, setResultLabel] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedSurface, setSelectedSurface] = useState('');
  const [selectedIndoorOutdoor, setSelectedIndoorOutdoor] = useState('');
  const [hasLights, setHasLights] = useState('');
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
    params.set('limit', '50'); params.set('mode', mode);
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
    `FindNearbyCourts:${typeof window !== 'undefined' ? window.location.pathname : ''}:${mode}:${query}:${location}:${r}`;

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

  const filteredAndSortedCourts = useMemo(() => {
    let filtered = [...nearbyCourts];
    if (selectedSurface) filtered = filtered.filter(c => c.surface === selectedSurface);
    if (selectedIndoorOutdoor) filtered = filtered.filter(c => c.indoorOutdoor === selectedIndoorOutdoor);
    if (hasLights === 'yes') filtered = filtered.filter(c => c.lights);
    else if (hasLights === 'no') filtered = filtered.filter(c => !c.lights);
    if (filterLocation) filtered = filtered.filter(c => c.city === filterLocation);
    filtered.sort((a, b) => sortByDistance === 'closest' ? a.distance - b.distance : b.distance - a.distance);
    return filtered;
  }, [nearbyCourts, selectedSurface, selectedIndoorOutdoor, hasLights, sortByDistance, filterLocation]);

  const availableLocations = useMemo(() =>
    Array.from(new Set(nearbyCourts.map(c => c.city))).sort(), [nearbyCourts]);

  const fetchNearbyCourts = async (
    mode: 'radius' | 'nearest' | 'location',
    overrides?: { query?: string; location?: string; radius?: number }
  ) => {
    const queryValue = overrides?.query ?? searchQuery;
    const locationValue = overrides?.location ?? searchLocation;
    const radiusValue = overrides?.radius ?? radiusKm;

    setSearchMode(mode); setSearchQuery(queryValue); setSearchLocation(locationValue); setRadiusKm(radiusValue);
    setLoading(true); setError(null); setNearbyCourts([]); setSuggestedCourts([]); setHasSearched(true); setResultLabel('');
    setSelectedSurface(''); setSelectedIndoorOutdoor(''); setHasLights(''); setSortByDistance('closest'); setFilterLocation('');

    const performSearch = async (latitude?: number, longitude?: number) => {
      try {
        const urlParams = buildUrlParams({ mode, latitude, longitude, radius: radiusValue, query: queryValue, location: locationValue });
        const response = await fetch(`/api/courts/nearby?${urlParams}`);
        if (!response.ok) throw new Error('Search failed.');
        const data: NearbyCourt[] = await response.json();
        setNearbyCourts(data);
        const label = data.length > 0
          ? mode === 'nearest' ? 'Nearest courts' : mode === 'location' ? 'Location results' : `Within ${radiusValue} km`
          : mode === 'radius' && latitude !== undefined ? `No courts within ${radiusValue} km` : 'No courts found';
        setResultLabel(label);
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `${window.location.pathname}?section=find-courts&${urlParams}`);
          window.sessionStorage.setItem(getCacheKey(mode, queryValue, locationValue, radiusValue), JSON.stringify({ nearbyCourts: data, suggestedCourts: [], resultLabel: label }));
        }
        if (data.length === 0 && mode === 'radius' && latitude !== undefined) {
          const sd: NearbyCourt[] = await (await fetch(`/api/courts/nearby?${buildUrlParams({ mode: 'nearest', latitude, longitude, query: queryValue, location: locationValue })}`)).json();
          setSuggestedCourts(sd.slice(0, 10));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courts');
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
        setNearbyCourts(p.nearbyCourts || []); setSuggestedCourts(p.suggestedCourts || []); setResultLabel(p.resultLabel || ''); return;
      } catch {}
    }
    fetchNearbyCourts(mode, { query, location, radius: r });
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const surfCfg = (surface: string) => SURFACE_CONFIG[surface] || SURFACE_CONFIG.Hard;
  const selectCls = `${inputBase} px-3 py-2.5 appearance-none cursor-pointer`;

  return (
    <div className="w-full text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Home className="w-4 h-4 text-[#7dc142]" />
          <h2 className="text-sm font-semibold tracking-widest uppercase text-white/70">Find Courts Near You</h2>
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
            placeholder="Court name, surface…"
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
          onClick={() => fetchNearbyCourts('radius')} disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#7dc142] hover:bg-[#8dd152] text-[#071207] text-xs font-bold tracking-wide uppercase transition-all disabled:opacity-50"
        >
          <Target className="w-3.5 h-3.5" />
          {loading ? 'Searching…' : `${radiusKm} km`}
        </button>
        <button
          onClick={() => fetchNearbyCourts('nearest')} disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-white/70 hover:text-white text-xs font-semibold tracking-wide uppercase transition-all disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Nearest
        </button>
        <button
          onClick={() => fetchNearbyCourts('location')} disabled={loading}
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
          {(resultLabel || nearbyCourts.length > 0) && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">
                {resultLabel}
                {filteredAndSortedCourts.length !== nearbyCourts.length && nearbyCourts.length > 0 &&
                  <span className="ml-1 text-[#7dc142]">· {filteredAndSortedCourts.length} shown</span>}
              </span>
              {nearbyCourts.length > 0 && (
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
          {showFilters && nearbyCourts.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              {[
                { label: 'Surface', value: selectedSurface, onChange: setSelectedSurface, options: SURFACES.map(s => ({ v: s, t: s })) },
                { label: 'Type', value: selectedIndoorOutdoor, onChange: setSelectedIndoorOutdoor, options: INDOOR_OUTDOOR.map(t => ({ v: t, t })) },
                { label: 'Lights', value: hasLights, onChange: setHasLights, options: [{ v: 'yes', t: 'With lights' }, { v: 'no', t: 'Without lights' }] },
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

          {/* Court cards */}
          {filteredAndSortedCourts.length > 0 ? (
            <div className="space-y-px">
              {filteredAndSortedCourts.map((court, i) => {
                const sc = surfCfg(court.surface);
                return (
                  <div
                    key={court.id}
                    onClick={() => onSelectCourt?.(court)}
                    className={`flex items-center gap-3 px-3 py-3 hover:bg-white/[0.04] transition-colors ${i === 0 ? 'rounded-t-lg' : ''} ${i === filteredAndSortedCourts.length - 1 ? 'rounded-b-lg' : ''} ${onSelectCourt ? 'cursor-pointer' : ''}`}
                  >
                    {/* Court image */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.05]">
                      <img src={court.image} alt={court.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white leading-none">{court.name}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>
                          <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                          {court.surface}
                        </span>
                        {court.lights && (
                          <span className="text-[10px] font-semibold text-yellow-400/80 bg-yellow-400/10 px-1.5 py-0.5 rounded">
                            🔆 Lit
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-white/30">{court.organization}</span>
                        <span className="text-white/15 text-xs">·</span>
                        <span className="text-xs text-white/30">{court.city}</span>
                        <span className="text-white/15 text-xs">·</span>
                        <span className="text-xs text-white/20">{court.indoorOutdoor}</span>
                      </div>
                    </div>

                    {/* Distance + book */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold text-[#7dc142]">{court.distance.toFixed(1)} km</span>
                      {onBookClick && (
                        <button
                          onClick={e => { e.stopPropagation(); onBookClick(court.id, court.name); }}
                          className="px-2.5 py-1.5 rounded-md bg-[#7dc142] hover:bg-[#8dd152] text-[#071207] text-xs font-bold uppercase tracking-wide transition-all"
                        >
                          Book
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : suggestedCourts.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 px-3 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <TrendingUp className="w-4 h-4 text-[#7dc142] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white/70">No courts within {radiusKm} km</p>
                  <p className="text-xs text-white/30 mt-0.5">Showing nearest courts outside your radius.</p>
                </div>
              </div>
              <div className="space-y-px">
                {suggestedCourts.map((court, i) => {
                  const sc = surfCfg(court.surface);
                  return (
                    <div key={court.id} className={`flex items-center gap-3 px-3 py-3 hover:bg-white/[0.04] transition-colors ${i === 0 ? 'rounded-t-lg' : ''} ${i === suggestedCourts.length - 1 ? 'rounded-b-lg' : ''}`}>
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.05]">
                        <img src={court.image} alt={court.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{court.name}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>
                            <span className={`w-1 h-1 rounded-full ${sc.dot}`} />{court.surface}
                          </span>
                        </div>
                        <span className="text-xs text-white/30">{court.city}</span>
                      </div>
                      <span className="text-xs font-semibold text-white/40">{court.distance.toFixed(1)} km</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : hasSearched && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                <Home className="w-5 h-5 text-white/20" />
              </div>
              <p className="text-sm font-medium text-white/30">No courts found</p>
              <p className="text-xs text-white/20 mt-1">Try a wider radius or nearest search</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};