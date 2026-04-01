'use client';

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface Court {
  id: string;
  name: string;
  courtNumber: number;
  surface: string;
  indoorOutdoor: string;
  lights: boolean;
  status: string;
  maintenedUntil?: string;
}

interface CourtsProps {
  orgId?: string;
}

export default function OrganizationCourtsSection({ orgId }: CourtsProps) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    courtNumber: '',
    surface: 'Clay',
    indoorOutdoor: 'Outdoor',
    lights: false,
    status: 'Active',
  });

  useEffect(() => {
    if (orgId) fetchCourts();
  }, [orgId]);

  async function fetchCourts() {
    if (!orgId) {
      setError('Organization ID is missing');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/courts`);
      if (!res.ok) throw new Error('Failed to fetch courts');
      const data = await res.json();
      setCourts(data.courts || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading courts');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `/api/organization/${orgId}/courts/${editingId}`
        : `/api/organization/${orgId}/courts`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          courtNumber: parseInt(formData.courtNumber),
          lights: Boolean(formData.lights),
        }),
      });

      if (!res.ok) throw new Error('Failed to save court');
      await fetchCourts();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving court');
    }
  }

  async function handleDelete(courtId: string) {
    if (!orgId || !confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/organization/${orgId}/courts/${courtId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete court');
      await fetchCourts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting court');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      courtNumber: '',
      surface: 'Clay',
      indoorOutdoor: 'Outdoor',
      lights: false,
      status: 'Active',
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(court: Court) {
    setFormData({
      name: court.name,
      courtNumber: court.courtNumber.toString(),
      surface: court.surface,
      indoorOutdoor: court.indoorOutdoor,
      lights: court.lights,
      status: court.status,
    });
    setEditingId(court.id);
    setShowForm(true);
  }

  const activeCount = courts.filter(c => c.status === 'Active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 12 
      }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, color: G.muted, marginBottom: 8, fontWeight: 600 }}>Total Courts</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: G.lime }}>{loading ? '-' : courts.length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, color: G.muted, marginBottom: 8, fontWeight: 600 }}>Active</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: G.bright }}>{loading ? '-' : activeCount}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, color: G.muted, marginBottom: 8, fontWeight: 600 }}>With Lights</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: G.accent }}>{loading ? '-' : courts.filter(c => c.lights).length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13, color: G.muted, marginBottom: 8, fontWeight: 600 }}>Indoor</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: G.yellow }}>{loading ? '-' : courts.filter(c => c.indoorOutdoor === 'Indoor').length}</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>{editingId ? '✏️ Edit Court' : '➕ Add New Court'}</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder="Court Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}
              />
              <input
                type="number"
                placeholder="Court #"
                value={formData.courtNumber}
                onChange={(e) => setFormData({...formData, courtNumber: e.target.value})}
                required
                style={{ width: 80, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                value={formData.surface}
                onChange={(e) => setFormData({...formData, surface: e.target.value})}
                style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}
              >
                <option value="Clay">Clay</option>
                <option value="Hard">Hard</option>
                <option value="Grass">Grass</option>
              </select>
              <select
                value={formData.indoorOutdoor}
                onChange={(e) => setFormData({...formData, indoorOutdoor: e.target.value})}
                style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}
              >
                <option value="Indoor">Indoor</option>
                <option value="Outdoor">Outdoor</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: G.text, fontSize: 12, flex: 1 }}>
                <input
                  type="checkbox"
                  checked={Boolean(formData.lights)}
                  onChange={(e) => setFormData({...formData, lights: e.target.checked})}
                />
                Has Lights
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ flex: 1, background: G.lime, color: G.dark, border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {editingId ? 'Update Court' : 'Add Court'}
              </button>
              <button type="button" onClick={resetForm} style={{ flex: 1, background: G.mid, color: G.text, border: `1px solid ${G.cardBorder}`, borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{ background: G.lime, color: G.dark, border: 'none', borderRadius: 8, padding: '12px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          ➕ Add New Court
        </button>
      )}

      {/* Courts Cards Grid */}
      <div>
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 16, color: G.text }}>🎾 Courts ({courts.length})</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: G.muted, fontSize: 14 }}>Loading courts...</div>
        ) : error ? (
          <div style={{ color: '#ff6b6b', padding: 16, background: G.card, borderRadius: 10, fontSize: 14 }}>Error: {error}</div>
        ) : courts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: G.muted, fontSize: 14 }}>No courts yet. Create one to get started!</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: 16,
          }}>
            {courts.map((court) => (
              <div 
                key={court.id} 
                style={{ 
                  background: G.card, 
                  border: `2px solid ${G.cardBorder}`, 
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                {/* Court Header */}
                <div style={{ borderBottom: `1px solid ${G.cardBorder}`, paddingBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: G.text, marginBottom: 6 }}>
                    {court.name}
                  </div>
                  <div style={{ fontSize: 14, color: G.muted, fontWeight: 600 }}>
                    Court #{court.courtNumber}
                  </div>
                </div>

                {/* Court Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>Surface</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: G.bright }}>{court.surface}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>Type</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: G.accent }}>{court.indoorOutdoor}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>Lights</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: court.lights ? G.yellow : G.muted }}>
                      {court.lights ? '💡 Yes' : 'No'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>Status</span>
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      color: court.status === 'Active' ? G.lime : G.yellow,
                      background: court.status === 'Active' ? G.lime + '20' : G.yellow + '20',
                      padding: '4px 8px',
                      borderRadius: 4
                    }}>
                      {court.status}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => startEdit(court)}
                    style={{ 
                      flex: 1, 
                      background: G.lime, 
                      color: G.dark, 
                      border: 'none', 
                      borderRadius: 6, 
                      padding: '10px 12px', 
                      fontSize: 13, 
                      fontWeight: 700, 
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(court.id)}
                    style={{ 
                      flex: 1, 
                      background: '#ff6b6b', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 6, 
                      padding: '10px 12px', 
                      fontSize: 13, 
                      fontWeight: 700, 
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={() => window.location.href = `/organization/${orgId}/courts/${court.id}`}
                    style={{ 
                      flex: 1, 
                      background: G.mid, 
                      color: G.lime, 
                      border: `2px solid ${G.lime}`, 
                      borderRadius: 6, 
                      padding: '10px 12px', 
                      fontSize: 13, 
                      fontWeight: 700, 
                      cursor: 'pointer'
                    }}
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
