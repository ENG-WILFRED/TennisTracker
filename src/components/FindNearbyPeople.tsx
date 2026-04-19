'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Users, MessageCircle, AlertCircle, TrendingUp, Search, Filter, ChevronDown, Zap, Target } from 'lucide-react';

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

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Beginner:     { bg: 'rgba(74,196,74,0.12)',  text: '#6dde6d', border: 'rgba(74,196,74,0.3)' },
  Intermediate: { bg: 'rgba(125,193,66,0.12)', text: '#7dc142', border: 'rgba(125,193,66,0.3)' },
  Advanced:     { bg: 'rgba(34,160,80,0.15)',  text: '#29d678', border: 'rgba(34,160,80,0.3)' },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');

  .fnp-root * { box-sizing: border-box; }

  .fnp-root {
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

  .fnp-root::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(125,193,66,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .fnp-root::after {
    content: '';
    position: absolute;
    bottom: -60px; left: -60px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(41,214,120,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .fnp-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    position: relative;
  }

  .fnp-title-group { display: flex; align-items: center; gap: 14px; }

  .fnp-icon-wrap {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, rgba(125,193,66,0.2), rgba(74,196,74,0.08));
    border: 1px solid rgba(125,193,66,0.3);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .fnp-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 26px; font-weight: 800;
    color: #7dc142; margin: 0; letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .fnp-subtitle { margin: 4px 0 0; color: #6a9a5a; font-size: 13px; font-weight: 400; }

  .fnp-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(125,193,66,0.2), transparent);
    margin: 0 0 26px;
  }

  .fnp-form-grid { display: grid; gap: 18px; margin-bottom: 22px; }

  .fnp-label {
    display: block; font-size: 11px; font-weight: 600;
    color: #7dc142; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;
  }

  .fnp-input-wrap {
    position: relative; display: flex; align-items: center;
  }

  .fnp-input-icon {
    position: absolute; left: 14px;
    color: #5a8a4a; pointer-events: none;
    width: 16px; height: 16px;
  }

  .fnp-input {
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

  .fnp-input:focus {
    border-color: rgba(125,193,66,0.5);
    box-shadow: 0 0 0 3px rgba(125,193,66,0.08);
  }

  .fnp-input::placeholder { color: #3d5e3d; }

  .fnp-select-wrap { position: relative; }

  .fnp-select {
    width: 100%;
    background: rgba(15,31,15,0.8);
    border: 1px solid rgba(45,90,53,0.6);
    border-radius: 12px;
    color: #e8f5e0;
    padding: 13px 40px 13px 14px;
    font-family: 'Barlow', sans-serif;
    font-size: 14px;
    appearance: none;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .fnp-select:focus {
    border-color: rgba(125,193,66,0.5);
    box-shadow: 0 0 0 3px rgba(125,193,66,0.08);
  }

  .fnp-select option { background: #0a1a0a; }

  .fnp-chevron {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    width: 16px; height: 16px; color: #5a8a4a; pointer-events: none;
  }

  .fnp-num-input {
    width: 140px;
    background: rgba(15,31,15,0.8);
    border: 1px solid rgba(45,90,53,0.6);
    border-radius: 12px;
    color: #e8f5e0;
    padding: 13px 14px;
    font-family: 'Barlow', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .fnp-num-input:focus {
    border-color: rgba(125,193,66,0.5);
    box-shadow: 0 0 0 3px rgba(125,193,66,0.08);
  }

  .fnp-btn-grid { display: grid; gap: 10px; margin-bottom: 26px; }

  .fnp-btn {
    width: 100%; border: none; border-radius: 13px;
    padding: 14px 18px; font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px; font-weight: 700; letter-spacing: 0.5px;
    cursor: pointer; transition: all 0.2s; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    position: relative; overflow: hidden;
  }

  .fnp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .fnp-btn-primary {
    background: linear-gradient(135deg, #5fc45f, #7dc142);
    color: #071207;
    box-shadow: 0 4px 16px rgba(95,196,95,0.25);
  }
  .fnp-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #6dd46d, #8fd14f);
    box-shadow: 0 6px 20px rgba(95,196,95,0.35);
    transform: translateY(-1px);
  }

  .fnp-btn-secondary {
    background: rgba(61,122,61,0.15);
    color: #9de87a;
    border: 1px solid rgba(95,196,95,0.3);
  }
  .fnp-btn-secondary:hover:not(:disabled) {
    background: rgba(61,122,61,0.25);
    border-color: rgba(95,196,95,0.5);
    transform: translateY(-1px);
  }

  .fnp-btn-tertiary {
    background: rgba(38,91,38,0.1);
    color: #7aaa6a;
    border: 1px solid rgba(61,122,61,0.25);
  }
  .fnp-btn-tertiary:hover:not(:disabled) {
    background: rgba(38,91,38,0.2);
    border-color: rgba(61,122,61,0.4);
    transform: translateY(-1px);
  }

  .fnp-error {
    background: rgba(30,47,30,0.8);
    border: 1px solid rgba(255,100,80,0.3);
    color: #ff9c7a;
    padding: 14px 16px;
    border-radius: 13px;
    margin-bottom: 20px;
    display: flex; align-items: center; gap: 10px;
    font-size: 13px;
  }

  .fnp-result-banner {
    background: rgba(17,36,17,0.9);
    border: 1px solid rgba(45,90,53,0.5);
    border-radius: 12px;
    padding: 12px 16px;
    color: #7dc142;
    font-size: 13px; font-weight: 600; letter-spacing: 0.3px;
    display: flex; align-items: center; gap: 8px;
  }

  .fnp-filter-panel {
    background: rgba(15,31,15,0.6);
    border: 1px solid rgba(45,90,53,0.4);
    border-radius: 16px;
    padding: 20px;
    backdrop-filter: blur(4px);
  }

  .fnp-filter-header {
    display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
  }

  .fnp-filter-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px; font-weight: 700; margin: 0;
    color: #e8f5e0; text-transform: uppercase; letter-spacing: 0.5px;
  }

  .fnp-filter-count {
    margin-left: auto;
    background: rgba(125,193,66,0.15);
    border: 1px solid rgba(125,193,66,0.3);
    color: #7dc142;
    padding: 3px 10px; border-radius: 999px;
    font-size: 12px; font-weight: 600;
  }

  .fnp-filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
  }

  .fnp-filter-select {
    background: rgba(19,41,19,0.8);
    border: 1px solid rgba(45,90,53,0.5);
    border-radius: 10px;
    color: #c8e8b8;
    padding: 9px 12px;
    font-family: 'Barlow', sans-serif;
    font-size: 13px; width: 100%; outline: none;
    transition: border-color 0.2s;
    cursor: pointer;
  }
  .fnp-filter-select:focus { border-color: rgba(125,193,66,0.5); }
  .fnp-filter-select option { background: #0a1a0a; }

  .fnp-card {
    background: rgba(19,41,19,0.7);
    border: 1px solid rgba(45,90,53,0.4);
    border-radius: 16px;
    padding: 18px 20px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 16px;
    align-items: center;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }

  .fnp-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(to right, transparent, rgba(125,193,66,0.2), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .fnp-card:hover {
    border-color: rgba(125,193,66,0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }

  .fnp-card:hover::before { opacity: 1; }

  .fnp-avatar {
    width: 64px; height: 64px; border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(125,193,66,0.4);
    box-shadow: 0 0 0 4px rgba(125,193,66,0.06);
  }

  .fnp-card-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px; font-weight: 700; margin: 0;
    color: #e8f5e0; line-height: 1.2;
  }

  .fnp-level-badge {
    padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
  }

  .fnp-username { margin: 4px 0 0; color: #5a8a4a; font-size: 13px; }
  .fnp-city { margin: 2px 0 0; color: #8ab07a; font-size: 13px; }

  .fnp-stats {
    display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;
  }

  .fnp-stat {
    background: rgba(10,24,10,0.6);
    border: 1px solid rgba(45,90,53,0.3);
    border-radius: 8px;
    padding: 4px 10px;
    font-size: 12px; color: #7aaa6a;
    display: flex; align-items: center; gap: 4px;
  }

  .fnp-distance-badge {
    background: rgba(125,193,66,0.12);
    border: 1px solid rgba(125,193,66,0.25);
    color: #7dc142;
    padding: 4px 10px; border-radius: 8px;
    font-size: 12px; font-weight: 700;
  }

  .fnp-card-actions { display: flex; flex-direction: column; gap: 8px; }

  .fnp-action-btn {
    border: none; border-radius: 10px;
    padding: 10px 16px; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px; font-weight: 700; letter-spacing: 0.3px;
    text-transform: uppercase;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .fnp-action-dm {
    background: linear-gradient(135deg, #5fc45f, #7dc142);
    color: #071207;
  }
  .fnp-action-dm:hover {
    background: linear-gradient(135deg, #6dd46d, #8fd14f);
    transform: translateY(-1px);
  }

  .fnp-action-challenge {
    background: rgba(31,95,31,0.2);
    color: #c8e8b8;
    border: 1px solid rgba(61,122,61,0.4) !important;
  }
  .fnp-action-challenge:hover {
    background: rgba(31,95,31,0.35);
    border-color: rgba(95,196,95,0.5) !important;
    transform: translateY(-1px);
  }

  .fnp-suggest-banner {
    background: rgba(17,38,21,0.8);
    border: 1px solid rgba(61,122,61,0.35);
    border-radius: 14px;
    padding: 16px 18px;
    color: #c9e7c9;
    display: flex; align-items: flex-start; gap: 12px;
  }

  .fnp-suggest-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px; font-weight: 700; margin: 0 0 4px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }

  .fnp-suggest-text { margin: 0; color: #7aaa6a; font-size: 13px; }

  .fnp-empty {
    background: rgba(17,39,21,0.6);
    border: 1px solid rgba(38,91,38,0.3);
    border-radius: 16px;
    padding: 36px 24px;
    text-align: center;
  }

  .fnp-empty-icon {
    width: 48px; height: 48px;
    background: rgba(125,193,66,0.1);
    border: 1px solid rgba(125,193,66,0.2);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px;
  }

  .fnp-empty-title { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 700; margin: 0; color: #9cc79c; text-transform: uppercase; }
  .fnp-empty-text { margin: 8px 0 0; color: #5a8a4a; font-size: 13px; }

  .fnp-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  @media (max-width: 600px) { .fnp-two-col { grid-template-columns: 1fr; } }
  @media (max-width: 700px) { .fnp-card { grid-template-columns: auto 1fr; } .fnp-card-actions { display: none; } }

  .fnp-pulse {
    display: inline-block; width: 8px; height: 8px;
    background: #7dc142; border-radius: 50%;
    animation: fnp-pulse 1.8s ease-in-out infinite;
  }
  @keyframes fnp-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }
`;

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

  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedGamesRange, setSelectedGamesRange] = useState<string>('');
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
    return `FindNearbyPeople:${window.location.pathname}:${mode}:${query}:${location}:${radius}`;
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

  const availableLocationsInResults = useMemo(() => {
    return Array.from(new Set(nearbyPeople.map(p => p.city))).sort();
  }, [nearbyPeople]);

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
        const url = `/api/players/nearby?${urlParams}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Search failed.');
        const data: NearbyPerson[] = await response.json();
        setNearbyPeople(data);
        const label = data.length > 0
          ? mode === 'nearest'
            ? 'Nearest players returned'
            : mode === 'location'
              ? 'Location search results'
              : `Players within ${radiusValue} km`
          : mode === 'radius' && latitude !== undefined
            ? `No players found within ${radiusValue} km`
            : 'No matching players found';
        setResultLabel(label);

        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `${window.location.pathname}?${urlParams}`);
          const cacheKey = getCacheKey(mode, queryValue, locationValue, radiusValue);
          window.sessionStorage.setItem(cacheKey, JSON.stringify({ nearbyPeople: data, suggestedPeople: [], resultLabel: label }));
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
        setNearbyPeople(parsed.nearbyPeople || []);
        setSuggestedPeople(parsed.suggestedPeople || []);
        setResultLabel(parsed.resultLabel || '');
        setError(null);
        return;
      } catch (error) {
        console.warn('Unable to restore nearby players from cache', error);
      }
    }

    fetchNearbyPeople(mode, { query, location, radius });
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const getLevelStyle = (level: string) => LEVEL_COLORS[level] || { bg: 'rgba(74,196,74,0.12)', text: '#7dc142', border: 'rgba(74,196,74,0.3)' };

  return (
    <>
      <style>{styles}</style>
      <div className="fnp-root">
        <div className="fnp-header">
          <div className="fnp-title-group">
            <div className="fnp-icon-wrap">
              <MapPin style={{ width: 22, height: 22, color: '#7dc142' }} />
            </div>
            <div>
              <h2 className="fnp-title">Find Players Near You</h2>
              <p className="fnp-subtitle">Search by name, city, nationality, level, or any profile detail</p>
            </div>
          </div>
          {loading && <span className="fnp-pulse" />}
        </div>

        <div className="fnp-divider" />

        <div className="fnp-form-grid">
          <div className="fnp-two-col">
            <div>
              <label className="fnp-label">Search term</label>
              <div className="fnp-input-wrap">
                <Search className="fnp-input-icon" />
                <input
                  className="fnp-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Name, city, nationality, level..."
                />
              </div>
            </div>
            <div>
              <label className="fnp-label">Location</label>
              <div className="fnp-select-wrap">
                <select className="fnp-select" value={searchLocation} onChange={e => setSearchLocation(e.target.value)}>
                  <option value="">Select a location...</option>
                  {AVAILABLE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="fnp-chevron" />
              </div>
            </div>
          </div>

          <div>
            <label className="fnp-label">Search radius (km)</label>
            <input
              className="fnp-num-input"
              type="number" value={radiusKm} min={1} max={200}
              onChange={e => setRadiusKm(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="fnp-btn-grid">
          <button className="fnp-btn fnp-btn-primary" onClick={() => fetchNearbyPeople('radius')} disabled={loading}>
            <Target style={{ width: 16, height: 16 }} />
            {loading ? 'Searching nearby...' : `Search within ${radiusKm} km`}
          </button>
          <div className="fnp-two-col">
            <button className="fnp-btn fnp-btn-secondary" onClick={() => fetchNearbyPeople('nearest')} disabled={loading}>
              <Zap style={{ width: 15, height: 15 }} />
              {loading ? 'Finding nearest...' : 'Nearest players'}
            </button>
            <button className="fnp-btn fnp-btn-tertiary" onClick={() => fetchNearbyPeople('location')} disabled={loading}>
              <MapPin style={{ width: 15, height: 15 }} />
              {loading ? 'Searching...' : 'By location'}
            </button>
          </div>
        </div>

        {error && (
          <div className="fnp-error">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {hasSearched && (
          <div style={{ display: 'grid', gap: 16 }}>
            {resultLabel && (
              <div className="fnp-result-banner">
                <span className="fnp-pulse" />
                {resultLabel}
              </div>
            )}

            {nearbyPeople.length > 0 && (
              <div className="fnp-filter-panel">
                <div className="fnp-filter-header">
                  <Filter style={{ width: 16, height: 16, color: '#7dc142' }} />
                  <h3 className="fnp-filter-title">Filter Results</h3>
                  <span className="fnp-filter-count">{filteredAndSortedPeople.length} players</span>
                </div>
                <div className="fnp-filter-grid">
                  <div>
                    <label className="fnp-label" style={{ marginBottom: 6 }}>Level</label>
                    <select className="fnp-filter-select" value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}>
                      <option value="">All levels</option>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="fnp-label" style={{ marginBottom: 6 }}>Games played</label>
                    <select className="fnp-filter-select" value={selectedGamesRange} onChange={e => setSelectedGamesRange(e.target.value)}>
                      <option value="">All ranges</option>
                      {GAMES_RANGES.map(r => <option key={r} value={r}>{r} games</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="fnp-label" style={{ marginBottom: 6 }}>Distance</label>
                    <select className="fnp-filter-select" value={sortByDistance} onChange={e => setSortByDistance(e.target.value as 'closest' | 'farthest')}>
                      <option value="closest">Closest first</option>
                      <option value="farthest">Farthest first</option>
                    </select>
                  </div>
                  <div>
                    <label className="fnp-label" style={{ marginBottom: 6 }}>City</label>
                    <select className="fnp-filter-select" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                      <option value="">All locations</option>
                      {availableLocationsInResults.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {filteredAndSortedPeople.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {filteredAndSortedPeople.map(person => {
                  const lvl = getLevelStyle(person.level);
                  return (
                    <div key={person.id} className="fnp-card" onClick={() => onSelectPerson?.(person)} style={{ cursor: onSelectPerson ? 'pointer' : 'default' }}>
                      <img src={person.photo} alt={person.name} className="fnp-avatar" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <h3 className="fnp-card-name">{person.name}</h3>
                          <span className="fnp-level-badge" style={{ background: lvl.bg, color: lvl.text, border: `1px solid ${lvl.border}` }}>
                            {person.level}
                          </span>
                        </div>
                        <p className="fnp-username">@{person.username}</p>
                        <p className="fnp-city">{person.city} · {person.nationality}</p>
                        <div className="fnp-stats">
                          <span className="fnp-stat">🏆 {person.wins} wins</span>
                          <span className="fnp-stat">🎾 {person.matchesPlayed} matches</span>
                          <span className="fnp-distance-badge">📍 {person.distance.toFixed(1)} km</span>
                        </div>
                      </div>
                      <div className="fnp-card-actions">
                        {onMessageClick && (
                          <button className="fnp-action-btn fnp-action-dm" onClick={e => { e.stopPropagation(); onMessageClick(person.id, person.name); }}>
                            DM
                          </button>
                        )}
                        {onChallengeClick && (
                          <button className="fnp-action-btn fnp-action-challenge" style={{ border: '1px solid' }} onClick={e => { e.stopPropagation(); onChallengeClick(person.id, person.name); }}>
                            Challenge
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : suggestedPeople.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="fnp-suggest-banner">
                  <TrendingUp style={{ width: 20, height: 20, color: '#7dc142', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="fnp-suggest-title">Suggested players beyond {radiusKm} km</p>
                    <p className="fnp-suggest-text">No players matched inside your radius — showing the nearest players outside it.</p>
                  </div>
                </div>
                {suggestedPeople.map(person => {
                  const lvl = getLevelStyle(person.level);
                  return (
                    <div key={person.id} className="fnp-card" style={{ gridTemplateColumns: 'auto 1fr' }}>
                      <img src={person.photo} alt={person.name} className="fnp-avatar" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <h3 className="fnp-card-name">{person.name}</h3>
                          <span className="fnp-level-badge" style={{ background: lvl.bg, color: lvl.text, border: `1px solid ${lvl.border}` }}>{person.level}</span>
                        </div>
                        <p className="fnp-username">@{person.username}</p>
                        <p className="fnp-city">{person.city}</p>
                        <div className="fnp-stats">
                          <span className="fnp-distance-badge">📍 {person.distance.toFixed(1)} km away</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : hasSearched && !loading ? (
              <div className="fnp-empty">
                <div className="fnp-empty-icon">
                  <Users style={{ width: 22, height: 22, color: '#7dc142' }} />
                </div>
                <p className="fnp-empty-title">No players found</p>
                <p className="fnp-empty-text">Try expanding the radius, adjusting filters, or using nearest search.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
};