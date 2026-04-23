'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Home, AlertCircle, TrendingUp, Search, Filter, ChevronDown, Zap, Target } from 'lucide-react';

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

const SURFACE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Clay:   { bg: 'rgba(194,120,60,0.12)',  text: '#e8a06a', border: 'rgba(194,120,60,0.3)' },
  Hard:   { bg: 'rgba(60,130,194,0.12)',  text: '#7ab8e8', border: 'rgba(60,130,194,0.3)' },
  Grass:  { bg: 'rgba(74,196,74,0.12)',   text: '#7dc142', border: 'rgba(74,196,74,0.3)'  },
  Carpet: { bg: 'rgba(130,60,194,0.12)',  text: '#b07ae8', border: 'rgba(130,60,194,0.3)' },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');

  .fnc-root * { box-sizing: border-box; }

  .fnc-root {
    font-family: 'Barlow', sans-serif;
    background: linear-gradient(145deg, #050f05 0%, #0a1a0a 50%, #071207 100%);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 24px;
    border: 1px solid rgba(74,196,74,0.15);
    color: #e8f5e0;
    position: relative;
    overflow: hidden;
  }

  .fnc-root::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(125,193,66,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .fnc-root::after {
    content: '';
    position: absolute;
    bottom: -60px; left: -60px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(41,214,120,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .fnc-header {
    display: flex; align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px; position: relative;
  }

  .fnc-title-group { display: flex; align-items: center; gap: 14px; }

  .fnc-icon-wrap {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, rgba(125,193,66,0.2), rgba(74,196,74,0.08));
    border: 1px solid rgba(125,193,66,0.3);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .fnc-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 26px; font-weight: 800;
    color: #7dc142; margin: 0; letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .fnc-subtitle { margin: 4px 0 0; color: #6a9a5a; font-size: 13px; font-weight: 400; }

  .fnc-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(125,193,66,0.2), transparent);
    margin: 0 0 26px;
  }

  .fnc-form-grid { display: grid; gap: 18px; margin-bottom: 22px; }

  .fnc-label {
    display: block; font-size: 11px; font-weight: 600;
    color: #7dc142; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;
  }

  .fnc-input-wrap { position: relative; display: flex; align-items: center; }

  .fnc-input-icon {
    position: absolute; left: 14px;
    color: #5a8a4a; pointer-events: none;
    width: 16px; height: 16px;
  }

  .fnc-input {
    width: 100%;
    background: rgba(15,31,15,0.8);
    border: 1px solid rgba(45,90,53,0.6);
    border-radius: 12px;
    color: #e8f5e0;
    padding: 13px 14px 13px 42px;
    font-family: 'Barlow', sans-serif;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }

  .fnc-input:focus {
    border-color: rgba(125,193,66,0.5);
    box-shadow: 0 0 0 3px rgba(125,193,66,0.08);
  }

  .fnc-input::placeholder { color: #3d5e3d; }

  .fnc-select-wrap { position: relative; }

  .fnc-select {
    width: 100%;
    background: rgba(15,31,15,0.8);
    border: 1px solid rgba(45,90,53,0.6);
    border-radius: 12px;
    color: #e8f5e0;
    padding: 13px 40px 13px 14px;
    font-family: 'Barlow', sans-serif;
    font-size: 14px;
    appearance: none; cursor: pointer; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .fnc-select:focus {
    border-color: rgba(125,193,66,0.5);
    box-shadow: 0 0 0 3px rgba(125,193,66,0.08);
  }

  .fnc-select option { background: #0a1a0a; }

  .fnc-chevron {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    width: 16px; height: 16px; color: #5a8a4a; pointer-events: none;
  }

  .fnc-num-input {
    width: 140px;
    background: rgba(15,31,15,0.8);
    border: 1px solid rgba(45,90,53,0.6);
    border-radius: 12px;
    color: #e8f5e0;
    padding: 13px 14px;
    font-family: 'Barlow', sans-serif;
    font-size: 14px; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .fnc-num-input:focus {
    border-color: rgba(125,193,66,0.5);
    box-shadow: 0 0 0 3px rgba(125,193,66,0.08);
  }

  .fnc-btn-grid { display: grid; gap: 10px; margin-bottom: 26px; }

  .fnc-btn {
    width: 100%; border: none; border-radius: 13px;
    padding: 14px 18px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px; font-weight: 700; letter-spacing: 0.5px;
    cursor: pointer; transition: all 0.2s; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }

  .fnc-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .fnc-btn-primary {
    background: linear-gradient(135deg, #5fc45f, #7dc142);
    color: #071207;
    box-shadow: 0 4px 16px rgba(95,196,95,0.25);
  }
  .fnc-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #6dd46d, #8fd14f);
    box-shadow: 0 6px 20px rgba(95,196,95,0.35);
    transform: translateY(-1px);
  }

  .fnc-btn-secondary {
    background: rgba(61,122,61,0.15);
    color: #9de87a;
    border: 1px solid rgba(95,196,95,0.3);
  }
  .fnc-btn-secondary:hover:not(:disabled) {
    background: rgba(61,122,61,0.25);
    border-color: rgba(95,196,95,0.5);
    transform: translateY(-1px);
  }

  .fnc-btn-tertiary {
    background: rgba(38,91,38,0.1);
    color: #7aaa6a;
    border: 1px solid rgba(61,122,61,0.25);
  }
  .fnc-btn-tertiary:hover:not(:disabled) {
    background: rgba(38,91,38,0.2);
    border-color: rgba(61,122,61,0.4);
    transform: translateY(-1px);
  }

  .fnc-error {
    background: rgba(30,47,30,0.8);
    border: 1px solid rgba(255,100,80,0.3);
    color: #ff9c7a;
    padding: 14px 16px; border-radius: 13px; margin-bottom: 20px;
    display: flex; align-items: center; gap: 10px; font-size: 13px;
  }

  .fnc-result-banner {
    background: rgba(17,36,17,0.9);
    border: 1px solid rgba(45,90,53,0.5);
    border-radius: 12px;
    padding: 12px 16px;
    color: #7dc142;
    font-size: 13px; font-weight: 600; letter-spacing: 0.3px;
    display: flex; align-items: center; gap: 8px;
  }

  .fnc-filter-panel {
    background: rgba(15,31,15,0.6);
    border: 1px solid rgba(45,90,53,0.4);
    border-radius: 16px;
    padding: 20px;
    backdrop-filter: blur(4px);
  }

  .fnc-filter-header {
    display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
  }

  .fnc-filter-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px; font-weight: 700; margin: 0;
    color: #e8f5e0; text-transform: uppercase; letter-spacing: 0.5px;
  }

  .fnc-filter-count {
    margin-left: auto;
    background: rgba(125,193,66,0.15);
    border: 1px solid rgba(125,193,66,0.3);
    color: #7dc142;
    padding: 3px 10px; border-radius: 999px;
    font-size: 12px; font-weight: 600;
  }

  .fnc-filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
  }

  .fnc-filter-select {
    background: rgba(19,41,19,0.8);
    border: 1px solid rgba(45,90,53,0.5);
    border-radius: 10px;
    color: #c8e8b8;
    padding: 9px 12px;
    font-family: 'Barlow', sans-serif;
    font-size: 13px; width: 100%; outline: none;
    transition: border-color 0.2s; cursor: pointer;
  }
  .fnc-filter-select:focus { border-color: rgba(125,193,66,0.5); }
  .fnc-filter-select option { background: #0a1a0a; }

  .fnc-card {
    background: rgba(19,41,19,0.7);
    border: 1px solid rgba(45,90,53,0.4);
    border-radius: 16px;
    overflow: hidden;
    display: grid;
    grid-template-columns: 88px 1fr auto;
    gap: 0;
    align-items: stretch;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    position: relative;
  }

  .fnc-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(to right, transparent, rgba(125,193,66,0.2), transparent);
    opacity: 0; transition: opacity 0.2s;
  }

  .fnc-card:hover {
    border-color: rgba(125,193,66,0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }

  .fnc-card:hover::before { opacity: 1; }

  .fnc-court-img {
    width: 88px;
    object-fit: cover;
    display: block;
    flex-shrink: 0;
  }

  .fnc-card-body {
    padding: 16px 18px;
    min-width: 0;
  }

  .fnc-card-name-row {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px;
  }

  .fnc-card-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px; font-weight: 700; margin: 0;
    color: #e8f5e0;
  }

  .fnc-dist-badge {
    background: rgba(125,193,66,0.12);
    border: 1px solid rgba(125,193,66,0.25);
    color: #7dc142;
    padding: 3px 10px; border-radius: 999px;
    font-size: 12px; font-weight: 700; white-space: nowrap;
  }

  .fnc-org { margin: 2px 0; color: #5a8a4a; font-size: 13px; }
  .fnc-address { margin: 2px 0; color: #8ab07a; font-size: 13px; }

  .fnc-tags {
    display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;
  }

  .fnc-tag {
    background: rgba(10,24,10,0.6);
    border: 1px solid rgba(45,90,53,0.3);
    border-radius: 7px;
    padding: 3px 10px;
    font-size: 12px; color: #7aaa6a;
  }

  .fnc-lights-tag {
    background: rgba(255,220,50,0.08);
    border: 1px solid rgba(255,220,50,0.2);
    color: #e8d560;
  }

  .fnc-card-action {
    display: flex; align-items: center; justify-content: center;
    padding: 0 18px;
    border-left: 1px solid rgba(45,90,53,0.3);
  }

  .fnc-book-btn {
    background: linear-gradient(135deg, #5fc45f, #7dc142);
    color: #071207; border: none;
    border-radius: 10px;
    padding: 12px 18px; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .fnc-book-btn:hover {
    background: linear-gradient(135deg, #6dd46d, #8fd14f);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(95,196,95,0.3);
  }

  .fnc-suggest-banner {
    background: rgba(17,38,21,0.8);
    border: 1px solid rgba(61,122,61,0.35);
    border-radius: 14px;
    padding: 16px 18px;
    color: #c9e7c9;
    display: flex; align-items: flex-start; gap: 12px;
  }

  .fnc-suggest-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px; font-weight: 700; margin: 0 0 4px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }

  .fnc-suggest-text { margin: 0; color: #7aaa6a; font-size: 13px; }

  .fnc-empty {
    background: rgba(17,39,21,0.6);
    border: 1px solid rgba(38,91,38,0.3);
    border-radius: 16px;
    padding: 36px 24px; text-align: center;
  }

  .fnc-empty-icon {
    width: 48px; height: 48px;
    background: rgba(125,193,66,0.1);
    border: 1px solid rgba(125,193,66,0.2);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px;
  }

  .fnc-empty-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px; font-weight: 700; margin: 0;
    color: #9cc79c; text-transform: uppercase;
  }

  .fnc-empty-text { margin: 8px 0 0; color: #5a8a4a; font-size: 13px; }

  .fnc-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  @media (max-width: 600px) { .fnc-two-col { grid-template-columns: 1fr; } }
  @media (max-width: 700px) { .fnc-card { grid-template-columns: 80px 1fr; } .fnc-card-action { display: none; } }

  .fnc-pulse {
    display: inline-block; width: 8px; height: 8px;
    background: #7dc142; border-radius: 50%;
    animation: fnc-pulse 1.8s ease-in-out infinite;
  }
  @keyframes fnc-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  .fnc-surface-badge {
    padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
`;

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

  const [selectedSurface, setSelectedSurface] = useState<string>('');
  const [selectedIndoorOutdoor, setSelectedIndoorOutdoor] = useState<string>('');
  const [hasLights, setHasLights] = useState<string>('');
  const [sortByDistance, setSortByDistance] = useState<'closest' | 'farthest'>('closest');
  const [filterLocation, setFilterLocation] = useState<string>('');

  const buildUrlParams = (options: { mode?: 'radius' | 'nearest' | 'location'; latitude?: number; longitude?: number; radius?: number; query?: string; location?: string }) => {
    const params = new URLSearchParams();
    const mode = options.mode || searchMode;
    const query = options.query ?? searchQuery;
    const location = options.location ?? searchLocation;
    const radius = typeof options.radius === 'number' ? options.radius : radiusKm;

    params.set('limit', '50');
    params.set('mode', mode);
    if (query.trim()) params.set('query', query.trim());
    if (location.trim()) params.set('location', location.trim());
    if (mode === 'nearest') params.set('nearest', 'true');
    else if (mode === 'radius') params.set('radius', String(radius));
    if (typeof options.latitude === 'number' && typeof options.longitude === 'number') {
      params.set('latitude', String(options.latitude));
      params.set('longitude', String(options.longitude));
    }
    return params.toString();
  };

  const getCacheKey = (mode: 'radius' | 'nearest' | 'location', query: string, location: string, radius: number) => {
    return `FindNearbyCourts:${window.location.pathname}:${mode}:${query}:${location}:${radius}`;
  };

  const loadInitialSearchFromUrl = () => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query') || '';
    const location = params.get('location') || '';
    const mode = (params.get('mode') as 'radius' | 'nearest' | 'location') || (params.get('nearest') === 'true' ? 'nearest' : params.has('location') ? 'location' : 'radius');
    const radius = Number(params.get('radius')) || radiusKm;
    if (!query && !location && !params.get('nearest') && !params.has('mode') && !params.has('radius')) {
      return null;
    }
    return { mode, query, location, radius };
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

  const availableLocationsInResults = useMemo(() => {
    return Array.from(new Set(nearbyCourts.map(c => c.city))).sort();
  }, [nearbyCourts]);

  const fetchNearbyCourts = async (
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
    setLoading(true); setError(null); setNearbyCourts([]); setSuggestedCourts([]);
    setHasSearched(true); setResultLabel('');
    setSelectedSurface(''); setSelectedIndoorOutdoor(''); setHasLights('');
    setSortByDistance('closest'); setFilterLocation('');

    const performSearch = async (latitude?: number, longitude?: number) => {
      try {
        const urlParams = buildUrlParams({ mode, latitude, longitude, radius: radiusValue, query: queryValue, location: locationValue });
        const url = `/api/courts/nearby?${urlParams}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Search failed.');
        const data: NearbyCourt[] = await response.json();
        setNearbyCourts(data);
        const label = data.length > 0
          ? mode === 'nearest'
            ? 'Nearest courts returned'
            : mode === 'location'
              ? 'Location search results'
              : `Courts within ${radiusValue} km`
          : mode === 'radius' && latitude !== undefined
            ? `No courts found within ${radiusValue} km`
            : 'No matching courts found';
        setResultLabel(label);

        if (typeof window !== 'undefined') {
          const currentSection = new URLSearchParams(window.location.search).get('section') || 'find-courts';
          window.history.replaceState(null, '', `${window.location.pathname}?section=${currentSection}&${urlParams}`);
          const cacheKey = getCacheKey(mode, queryValue, locationValue, radiusValue);
          window.sessionStorage.setItem(cacheKey, JSON.stringify({ nearbyCourts: data, suggestedCourts: [], resultLabel: label }));
        }

        if (data.length === 0 && mode === 'radius' && latitude !== undefined) {
          const suggestData: NearbyCourt[] = await (await fetch(`/api/courts/nearby?${buildUrlParams({ mode: 'nearest', latitude, longitude, query: queryValue, location: locationValue })}`)).json();
          setSuggestedCourts(suggestData.slice(0, 10));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courts');
      } finally {
        setLoading(false);
      }
    };

    if (mode === 'location') {
      if (!locationValue.trim() && !queryValue.trim()) { setError('Please enter a location or search term.'); setLoading(false); return; }
      const fallbackCoordinates = locationValue.trim() ? LOCATION_COORDINATES[locationValue.trim()] : undefined;
      if (!navigator.geolocation) {
        if (fallbackCoordinates) {
          performSearch(fallbackCoordinates.latitude, fallbackCoordinates.longitude);
          return;
        }
        setError('Geolocation not supported. Please allow location access or choose a known location.');
        setLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => performSearch(pos.coords.latitude, pos.coords.longitude),
        err => {
          if (fallbackCoordinates) {
            performSearch(fallbackCoordinates.latitude, fallbackCoordinates.longitude);
            return;
          }
          setError(`Location access denied: ${err.message}`);
          setLoading(false);
        }
      );
      return;
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
    const initialSearch = loadInitialSearchFromUrl();
    if (!initialSearch) return;

    const { mode, query, location, radius } = initialSearch;
    setSearchMode(mode);
    setSearchQuery(query);
    setSearchLocation(location);
    setRadiusKm(radius);
    setHasSearched(true);

    const cacheKey = getCacheKey(mode, query, location, radius);
    const cached = window.sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setNearbyCourts(parsed.nearbyCourts || []);
        setSuggestedCourts(parsed.suggestedCourts || []);
        setResultLabel(parsed.resultLabel || '');
        setError(null);
        return;
      } catch (error) {
        console.warn('Unable to restore nearby courts from cache', error);
      }
    }

    fetchNearbyCourts(mode, { query, location, radius });
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const getSurfaceStyle = (surface: string) => SURFACE_COLORS[surface] || { bg: 'rgba(74,196,74,0.12)', text: '#7dc142', border: 'rgba(74,196,74,0.3)' };

  return (
    <>
      <style>{styles}</style>
      <div className="fnc-root">
        <div className="fnc-header">
          <div className="fnc-title-group">
            <div className="fnc-icon-wrap">
              <Home style={{ width: 22, height: 22, color: '#7dc142' }} />
            </div>
            <div>
              <h2 className="fnc-title">Find Courts Near You</h2>
              <p className="fnc-subtitle">Search by venue, city, surface, lighting, or available location</p>
            </div>
          </div>
          {loading && <span className="fnc-pulse" />}
        </div>

        <div className="fnc-divider" />

        <div className="fnc-form-grid">
          <div className="fnc-two-col">
            <div>
              <label className="fnc-label">Search term</label>
              <div className="fnc-input-wrap">
                <Search className="fnc-input-icon" />
                <input
                  className="fnc-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Court name, city, surface..."
                />
              </div>
            </div>
            <div>
              <label className="fnc-label">Location</label>
              <div className="fnc-select-wrap">
                <select className="fnc-select" value={searchLocation} onChange={e => setSearchLocation(e.target.value)}>
                  <option value="">Select a location...</option>
                  {AVAILABLE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="fnc-chevron" />
              </div>
            </div>
          </div>

          <div>
            <label className="fnc-label">Search radius (km)</label>
            <input
              className="fnc-num-input"
              type="number" value={radiusKm} min={1} max={200}
              onChange={e => setRadiusKm(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="fnc-btn-grid">
          <button className="fnc-btn fnc-btn-primary" onClick={() => fetchNearbyCourts('radius')} disabled={loading}>
            <Target style={{ width: 16, height: 16 }} />
            {loading ? 'Searching nearby...' : `Search within ${radiusKm} km`}
          </button>
          <div className="fnc-two-col">
            <button className="fnc-btn fnc-btn-secondary" onClick={() => fetchNearbyCourts('nearest')} disabled={loading}>
              <Zap style={{ width: 15, height: 15 }} />
              {loading ? 'Finding nearest...' : 'Nearest courts'}
            </button>
            <button className="fnc-btn fnc-btn-tertiary" onClick={() => fetchNearbyCourts('location')} disabled={loading}>
              <MapPin style={{ width: 15, height: 15 }} />
              {loading ? 'Searching...' : 'By location'}
            </button>
          </div>
        </div>

        {error && (
          <div className="fnc-error">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {hasSearched && (
          <div style={{ display: 'grid', gap: 16 }}>
            {resultLabel && (
              <div className="fnc-result-banner">
                <span className="fnc-pulse" />
                {resultLabel}
              </div>
            )}

            {nearbyCourts.length > 0 && (
              <div className="fnc-filter-panel">
                <div className="fnc-filter-header">
                  <Filter style={{ width: 16, height: 16, color: '#7dc142' }} />
                  <h3 className="fnc-filter-title">Filter Results</h3>
                  <span className="fnc-filter-count">{filteredAndSortedCourts.length} courts</span>
                </div>
                <div className="fnc-filter-grid">
                  <div>
                    <label className="fnc-label" style={{ marginBottom: 6 }}>Surface</label>
                    <select className="fnc-filter-select" value={selectedSurface} onChange={e => setSelectedSurface(e.target.value)}>
                      <option value="">All surfaces</option>
                      {SURFACES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="fnc-label" style={{ marginBottom: 6 }}>Type</label>
                    <select className="fnc-filter-select" value={selectedIndoorOutdoor} onChange={e => setSelectedIndoorOutdoor(e.target.value)}>
                      <option value="">All types</option>
                      {INDOOR_OUTDOOR.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="fnc-label" style={{ marginBottom: 6 }}>Lights</label>
                    <select className="fnc-filter-select" value={hasLights} onChange={e => setHasLights(e.target.value)}>
                      <option value="">All courts</option>
                      <option value="yes">With lights</option>
                      <option value="no">Without lights</option>
                    </select>
                  </div>
                  <div>
                    <label className="fnc-label" style={{ marginBottom: 6 }}>Distance</label>
                    <select className="fnc-filter-select" value={sortByDistance} onChange={e => setSortByDistance(e.target.value as 'closest' | 'farthest')}>
                      <option value="closest">Closest first</option>
                      <option value="farthest">Farthest first</option>
                    </select>
                  </div>
                  <div>
                    <label className="fnc-label" style={{ marginBottom: 6 }}>City</label>
                    <select className="fnc-filter-select" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                      <option value="">All locations</option>
                      {availableLocationsInResults.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {filteredAndSortedCourts.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {filteredAndSortedCourts.map(court => {
                  const surf = getSurfaceStyle(court.surface);
                  return (
                    <div key={court.id} className="fnc-card" onClick={() => onSelectCourt?.(court)} style={{ cursor: onSelectCourt ? 'pointer' : 'default' }}>
                      <img src={court.image} alt={court.name} className="fnc-court-img" />
                      <div className="fnc-card-body">
                        <div className="fnc-card-name-row">
                          <h3 className="fnc-card-name">{court.name}</h3>
                          <span className="fnc-dist-badge">📍 {court.distance.toFixed(1)} km</span>
                        </div>
                        <p className="fnc-org">{court.organization}</p>
                        <p className="fnc-address">{court.address}</p>
                        <div className="fnc-tags">
                          <span className="fnc-surface-badge" style={{ background: surf.bg, color: surf.text, border: `1px solid ${surf.border}` }}>
                            {court.surface}
                          </span>
                          <span className="fnc-tag">{court.indoorOutdoor}</span>
                          {court.lights && <span className="fnc-tag fnc-lights-tag">🔆 Lights</span>}
                        </div>
                      </div>
                      {onBookClick && (
                        <div className="fnc-card-action">
                          <button className="fnc-book-btn" onClick={e => { e.stopPropagation(); onBookClick(court.id, court.name); }}>
                            Book
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : suggestedCourts.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="fnc-suggest-banner">
                  <TrendingUp style={{ width: 20, height: 20, color: '#7dc142', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="fnc-suggest-title">Suggested courts beyond {radiusKm} km</p>
                    <p className="fnc-suggest-text">No courts were found inside your radius — showing the nearest available courts outside it.</p>
                  </div>
                </div>
                {suggestedCourts.map(court => {
                  const surf = getSurfaceStyle(court.surface);
                  return (
                    <div key={court.id} className="fnc-card" style={{ gridTemplateColumns: '80px 1fr' }}>
                      <img src={court.image} alt={court.name} className="fnc-court-img" />
                      <div className="fnc-card-body">
                        <div className="fnc-card-name-row">
                          <h3 className="fnc-card-name">{court.name}</h3>
                          <span className="fnc-dist-badge">{court.distance.toFixed(1)} km</span>
                        </div>
                        <p className="fnc-org">{court.organization}</p>
                        <p className="fnc-address">{court.city}</p>
                        <div className="fnc-tags">
                          <span className="fnc-surface-badge" style={{ background: surf.bg, color: surf.text, border: `1px solid ${surf.border}` }}>
                            {court.surface}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : hasSearched && !loading ? (
              <div className="fnc-empty">
                <div className="fnc-empty-icon">
                  <Home style={{ width: 22, height: 22, color: '#7dc142' }} />
                </div>
                <p className="fnc-empty-title">No courts found</p>
                <p className="fnc-empty-text">Try expanding the radius, adjusting filters, or using nearest search.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
};