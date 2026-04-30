'use client';

import React, { useState, useEffect } from 'react';

const G = {
  dark: '#0a180a',
  sidebar: '#0f1e0f',
  card: '#162616',
  card2: '#1b2f1b',
  card3: '#203520',
  border: '#243e24',
  border2: '#326832',
  mid: '#2a5224',
  bright: '#3a7230',
  lime: '#79bf3e',
  lime2: '#a8d84e',
  text: '#e4f2da',
  text2: '#c2dbb0',
  muted: '#5e8e50',
  muted2: '#7aaa68',
  yellow: '#efc040',
  red: '#d94f4f',
  blue: '#4a9eff',
};

export type ActivityType = 'session' | 'tournament' | 'restocking' | 'player-reachout' | 'email';

export interface ActivityFormData {
  type: ActivityType;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  
  // Session fields
  sessionType?: '1-on-1' | 'group' | 'clinic';
  court?: string;
  courtId?: string;
  playerName?: string;
  maxParticipants?: number;
  price?: number;
  
  // Tournament fields
  tournamentName?: string;
  location?: string;
  locationId?: string;
  level?: string;
  
  // Restocking fields
  itemName?: string;
  quantity?: number;
  supplier?: string;
  cost?: number;
  
  // Player reachout fields
  playerEmail?: string;
  reachoutReason?: string;
  
  // Email fields
  emailSubject?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface Court {
  id: string;
  name: string;
  courtNumber: number;
  surface: string;
  indoorOutdoor: string;
  lights: boolean;
}

const activityTypeConfig: Record<ActivityType, { label: string; icon: string; color: string }> = {
  'session': { label: 'Session', icon: '👤', color: G.lime },
  'tournament': { label: 'Tournament', icon: '🏆', color: G.yellow },
  'restocking': { label: 'Restocking', icon: '📦', color: G.blue },
  'player-reachout': { label: 'Player Reachout', icon: '📞', color: '#ff6b9d' },
  'email': { label: 'Email', icon: '✉️', color: '#4da6ff' },
};

// Helper to get initial form data based on activity type
const getInitialFormData = (type: ActivityType, selectedDate?: string | null, editingActivity?: ActivityFormData & { id?: string } | null): ActivityFormData => {
  const baseData = {
    type,
    date: editingActivity?.date || selectedDate || new Date().toISOString().split('T')[0],
    startTime: editingActivity?.startTime || '10:00',
    endTime: editingActivity?.endTime || '11:00',
    title: editingActivity?.title || '',
    description: editingActivity?.description || '',
  };

  switch (type) {
    case 'session':
      return {
        ...baseData,
        sessionType: editingActivity?.sessionType || '1-on-1',
        court: editingActivity?.court || '',
        courtId: editingActivity?.courtId || '',
        playerName: editingActivity?.playerName || '',
        maxParticipants: editingActivity?.maxParticipants || 1,
        price: editingActivity?.price || 0,
        // Don't include fields for other types
        quantity: undefined,
        cost: undefined,
        priority: undefined,
        tournamentName: undefined,
        location: undefined,
        locationId: undefined,
        level: undefined,
        itemName: undefined,
        supplier: undefined,
        playerEmail: undefined,
        reachoutReason: undefined,
        emailSubject: undefined,
      };
    case 'tournament':
      return {
        ...baseData,
        tournamentName: editingActivity?.tournamentName || '',
        location: editingActivity?.location || '',
        locationId: editingActivity?.locationId || '',
        level: editingActivity?.level || 'intermediate',
        // Don't include fields for other types
        sessionType: undefined,
        court: undefined,
        courtId: undefined,
        playerName: undefined,
        maxParticipants: undefined,
        price: undefined,
        quantity: undefined,
        cost: undefined,
        priority: undefined,
        itemName: undefined,
        supplier: undefined,
        playerEmail: undefined,
        reachoutReason: undefined,
        emailSubject: undefined,
      };
    case 'restocking':
      return {
        ...baseData,
        itemName: editingActivity?.itemName || '',
        quantity: editingActivity?.quantity || 0,
        supplier: editingActivity?.supplier || '',
        cost: editingActivity?.cost || 0,
        // Don't include fields for other types
        sessionType: undefined,
        court: undefined,
        courtId: undefined,
        playerName: undefined,
        maxParticipants: undefined,
        price: undefined,
        priority: undefined,
        tournamentName: undefined,
        location: undefined,
        locationId: undefined,
        level: undefined,
        playerEmail: undefined,
        reachoutReason: undefined,
        emailSubject: undefined,
      };
    case 'player-reachout':
      return {
        ...baseData,
        playerName: editingActivity?.playerName || '',
        playerEmail: editingActivity?.playerEmail || '',
        reachoutReason: editingActivity?.reachoutReason || 'general',
        // Don't include fields for other types
        sessionType: undefined,
        court: undefined,
        courtId: undefined,
        maxParticipants: undefined,
        price: undefined,
        quantity: undefined,
        cost: undefined,
        priority: undefined,
        tournamentName: undefined,
        location: undefined,
        locationId: undefined,
        level: undefined,
        itemName: undefined,
        supplier: undefined,
        emailSubject: undefined,
      };
    case 'email':
      return {
        ...baseData,
        emailSubject: editingActivity?.emailSubject || '',
        priority: editingActivity?.priority || 'medium',
        // Don't include fields for other types
        sessionType: undefined,
        court: undefined,
        courtId: undefined,
        playerName: undefined,
        maxParticipants: undefined,
        price: undefined,
        quantity: undefined,
        cost: undefined,
        tournamentName: undefined,
        location: undefined,
        locationId: undefined,
        level: undefined,
        itemName: undefined,
        supplier: undefined,
        playerEmail: undefined,
        reachoutReason: undefined,
      };
    default:
      return baseData as ActivityFormData;
  }
};

interface ActivityModalProps {
  isOpen: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onSave: (data: ActivityFormData) => Promise<void>;
  coachId: string;
  editingActivity?: ActivityFormData & { id?: string } | null;
}

export default function ActivityModal({ isOpen, selectedDate, onClose, onSave, coachId, editingActivity }: ActivityModalProps) {
  const [activeType, setActiveType] = useState<ActivityType>(editingActivity?.type || 'session');
  const [courts, setCourts] = useState<Court[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [showOtherCourtInput, setShowOtherCourtInput] = useState(false);
  const [showOtherLocationInput, setShowOtherLocationInput] = useState(false);
  const [formData, setFormData] = useState<ActivityFormData>(
    getInitialFormData(editingActivity?.type || 'session', selectedDate, editingActivity)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch courts when modal opens
  useEffect(() => {
    if (isOpen && coachId) {
      setError(null); // Clear any previous errors when opening
      fetchCourts();
    }
  }, [isOpen, coachId]);

  const fetchCourts = async () => {
    try {
      setLoadingCourts(true);
      const res = await fetch(`/api/coaches/courts?coachId=${coachId}`);
      if (res.ok) {
        const data = await res.json();
        setCourts(data.courts || []);
      } else {
        // Log detailed error information
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`Failed to fetch courts (${res.status}):`, errorData);
        setError(`Failed to fetch courts: ${errorData?.error || res.statusText || 'Unknown error'}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error fetching courts:', errorMessage);
      setError(`Error fetching courts: ${errorMessage}`);
    } finally {
      setLoadingCourts(false);
    }
  };

  useEffect(() => {
    if (isOpen && !editingActivity) {
      setActiveType('session');
      setShowOtherCourtInput(false);
      setShowOtherLocationInput(false);
      setFormData(getInitialFormData('session', selectedDate));
    } else if (isOpen && editingActivity) {
      setActiveType(editingActivity.type);
      // Check if court/location was custom (not in court list)
      const courtIsCustom = !!(editingActivity.court && !courts.find(c => c.id === editingActivity.courtId));
      const locationIsCustom = !!(editingActivity.location && !courts.find(c => c.id === editingActivity.locationId));
      setShowOtherCourtInput(courtIsCustom);
      setShowOtherLocationInput(locationIsCustom);
      setFormData(getInitialFormData(editingActivity.type, selectedDate, editingActivity));
    }
  }, [isOpen, editingActivity, selectedDate, courts]);

  const handleTypeChange = (type: ActivityType) => {
    setActiveType(type);
    // Reset form with only fields relevant to new type, keeping common fields
    const currentCommonData = {
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      title: formData.title,
      description: formData.description,
    };
    const newFormData = getInitialFormData(type, undefined);
    setFormData({
      ...newFormData,
      ...currentCommonData,
      type,
    });
    setError(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.date) {
      setError('Date is required');
      return false;
    }
    if (!formData.startTime) {
      setError('Start time is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
      // Reset form only if not editing
      if (!editingActivity) {
        setFormData(getInitialFormData('session', new Date().toISOString().split('T')[0]));
        setShowOtherCourtInput(false);
        setShowOtherLocationInput(false);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: G.card,
          border: `1px solid ${G.border2}`,
          borderRadius: 14,
          width: '90%',
          maxWidth: 700,
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 1001,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 20px',
          borderBottom: `1px solid ${G.border}`,
          background: G.card2,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: G.text }}>
            {editingActivity ? 'Edit Activity' : 'Add Activity'}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: G.muted,
              cursor: 'pointer',
              padding: 0,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Activity Type Selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: G.lime2, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              Activity Type
            </div>
            {editingActivity ? (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: `${activityTypeConfig[activeType].color}15`, border: `2px solid ${activityTypeConfig[activeType].color}`, color: activityTypeConfig[activeType].color, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {activityTypeConfig[activeType].icon} {activityTypeConfig[activeType].label}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.keys(activityTypeConfig) as ActivityType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `2px solid ${activeType === type ? activityTypeConfig[type].color : G.border}`,
                      background: activeType === type ? `${activityTypeConfig[type].color}15` : G.card2,
                      color: activeType === type ? activityTypeConfig[type].color : G.text2,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all .2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {activityTypeConfig[type].icon} {activityTypeConfig[type].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: G.card3,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    color: G.text,
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: G.card3,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    color: G.text,
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: G.card3,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    color: G.text,
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            {/* Title & Description */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter activity title"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: G.card3,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  color: G.text,
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Add any notes or details"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: G.card3,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  color: G.text,
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Type-specific fields */}
            {activeType === 'session' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Session Type
                    </label>
                    <select
                      value={formData.sessionType || '1-on-1'}
                      onChange={(e) => handleInputChange('sessionType', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                      }}
                    >
                      <option value="1-on-1">1-on-1</option>
                      <option value="group">Group</option>
                      <option value="clinic">Clinic</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Court / Location
                    </label>
                    <select
                      disabled={loadingCourts}
                      value={formData.courtId || (showOtherCourtInput ? 'other' : '')}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          setShowOtherCourtInput(true);
                          handleInputChange('courtId', 'other');
                          handleInputChange('court', '');
                        } else {
                          setShowOtherCourtInput(false);
                          const selectedCourt = courts.find(c => c.id === e.target.value);
                          handleInputChange('courtId', e.target.value);
                          handleInputChange('court', selectedCourt?.name || '');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                        opacity: loadingCourts ? 0.6 : 1,
                        cursor: loadingCourts ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <option value="">
                        {loadingCourts ? '-- Loading courts... --' : '-- Select Court --'}
                      </option>
                      {courts.map(court => (
                        <option key={court.id} value={court.id}>
                          {court.name} ({court.surface}, {court.indoorOutdoor})
                        </option>
                      ))}
                      <option value="other">Other...</option>
                    </select>
                    {showOtherCourtInput && (
                      <input
                        type="text"
                        value={formData.court || ''}
                        onChange={(e) => handleInputChange('court', e.target.value)}
                        placeholder="Enter custom location name"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: G.card3,
                          border: `1px solid ${G.lime}`,
                          borderRadius: 8,
                          color: G.text,
                          fontSize: 13,
                          marginTop: 8,
                        }}
                      />
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={formData.maxParticipants || 1}
                      onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                      min="1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={formData.price || 0}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {activeType === 'tournament' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Tournament Name
                    </label>
                    <input
                      type="text"
                      value={formData.tournamentName || ''}
                      onChange={(e) => handleInputChange('tournamentName', e.target.value)}
                      placeholder="Tournament name"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Level
                    </label>
                    <select
                      value={formData.level || 'intermediate'}
                      onChange={(e) => handleInputChange('level', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                      }}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Court / Location
                  </label>
                  <select
                    disabled={loadingCourts}
                    value={formData.locationId || (showOtherLocationInput ? 'other' : '')}
                    onChange={(e) => {
                      if (e.target.value === 'other') {
                        setShowOtherLocationInput(true);
                        handleInputChange('locationId', 'other');
                        handleInputChange('location', '');
                      } else {
                        setShowOtherLocationInput(false);
                        const selectedCourt = courts.find(c => c.id === e.target.value);
                        handleInputChange('locationId', e.target.value);
                        handleInputChange('location', selectedCourt?.name || '');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: G.card3,
                      border: `1px solid ${G.border}`,
                      borderRadius: 8,
                      color: G.text,
                      fontSize: 13,
                      opacity: loadingCourts ? 0.6 : 1,
                      cursor: loadingCourts ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="">
                      {loadingCourts ? '-- Loading courts... --' : '-- Select Court --'}
                    </option>
                    {courts.map(court => (
                      <option key={court.id} value={court.id}>
                        {court.name} ({court.surface}, {court.indoorOutdoor})
                      </option>
                    ))}
                    <option value="other">Other...</option>
                  </select>
                  {showOtherLocationInput && (
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter custom location name"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.lime}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                        marginTop: 8,
                      }}
                    />
                  )}
                </div>
              </>
            )}

            {activeType === 'restocking' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={formData.itemName || ''}
                      onChange={(e) => handleInputChange('itemName', e.target.value)}
                      placeholder="e.g., Tennis Balls"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity || 0}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={formData.supplier || ''}
                      onChange={(e) => handleInputChange('supplier', e.target.value)}
                      placeholder="Supplier name"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Cost ($)
                    </label>
                    <input
                      type="number"
                      value={formData.cost || 0}
                      onChange={(e) => handleInputChange('cost', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: G.card3,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        color: G.text,
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {activeType === 'player-reachout' && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={formData.playerName || ''}
                    onChange={(e) => handleInputChange('playerName', e.target.value)}
                    placeholder="Player name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: G.card3,
                      border: `1px solid ${G.border}`,
                      borderRadius: 8,
                      color: G.text,
                      fontSize: 13,
                    }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.playerEmail || ''}
                    onChange={(e) => handleInputChange('playerEmail', e.target.value)}
                    placeholder="Player email"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: G.card3,
                      border: `1px solid ${G.border}`,
                      borderRadius: 8,
                      color: G.text,
                      fontSize: 13,
                    }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Reason for Reachout
                  </label>
                  <select
                    value={formData.reachoutReason || 'general'}
                    onChange={(e) => handleInputChange('reachoutReason', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: G.card3,
                      border: `1px solid ${G.border}`,
                      borderRadius: 8,
                      color: G.text,
                      fontSize: 13,
                    }}
                  >
                    <option value="general">General Check-in</option>
                    <option value="feedback">Performance Feedback</option>
                    <option value="next-session">Schedule Next Session</option>
                    <option value="motivation">Motivation/Support</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                </div>
              </>
            )}

            {activeType === 'email' && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={formData.emailSubject || ''}
                    onChange={(e) => handleInputChange('emailSubject', e.target.value)}
                    placeholder="Email subject"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: G.card3,
                      border: `1px solid ${G.border}`,
                      borderRadius: 8,
                      color: G.text,
                      fontSize: 13,
                    }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, color: G.lime2, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) => handleInputChange('priority', e.target.value as 'low' | 'medium' | 'high')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: G.card3,
                      border: `1px solid ${G.border}`,
                      borderRadius: 8,
                      color: G.text,
                      fontSize: 13,
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div
                style={{
                  background: 'rgba(217,79,79,0.1)',
                  border: `1px solid ${G.red}`,
                  borderRadius: 8,
                  padding: '12px',
                  color: G.red,
                  fontSize: 12,
                  marginBottom: 18,
                }}
              >
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: `1px solid ${G.border}`,
                  background: G.card2,
                  color: G.text,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: G.lime,
                  color: '#0a180a',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Saving...' : editingActivity ? 'Update Activity' : 'Save Activity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
