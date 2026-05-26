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
  nextMaintenanceDate?: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    courtNumber: '',
    surface: 'clay',
    indoorOutdoor: 'Outdoor',
    lights: false,
    status: 'Active',
    maintenedUntil: '',
    nextMaintenanceDate: '',
  });

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

    setIsSubmitting(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `/api/organization/${orgId}/courts/${editingId}`
        : `/api/organization/${orgId}/courts`;

      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          courtNumber: parseInt(formData.courtNumber),
          lights: Boolean(formData.lights),
          maintenedUntil: formData.maintenedUntil || undefined,
          nextMaintenanceDate: formData.nextMaintenanceDate || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to save court');
      
      const responseData = await res.json();
      
      if (editingId) {
        // Update existing court in state
        setCourts(courts.map(c => c.id === editingId ? { ...c, ...formData, courtNumber: parseInt(formData.courtNumber), lights: Boolean(formData.lights) } : c));
        setToast({ type: 'success', message: '✅ Court updated successfully!' });
      } else {
        // Add new court to state
        const newCourt = {
          id: responseData.id || Date.now().toString(),
          name: formData.name,
          courtNumber: parseInt(formData.courtNumber),
          surface: formData.surface,
          indoorOutdoor: formData.indoorOutdoor,
          lights: Boolean(formData.lights),
          status: formData.status,
          maintenedUntil: formData.maintenedUntil || undefined,
          nextMaintenanceDate: formData.nextMaintenanceDate || undefined,
        };
        setCourts([...courts, newCourt]);
        setToast({ type: 'success', message: '✅ Court created successfully!' });
      }
      
      resetForm();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error saving court';
      setToast({ type: 'error', message: `❌ ${errorMsg}` });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(courtId: string) {
    if (!orgId || !confirm('Are you sure?')) return;
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/courts/${courtId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete court');
      
      // Remove from state immediately
      setCourts(courts.filter(c => c.id !== courtId));
      setToast({ type: 'success', message: '✅ Court deleted successfully!' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error deleting court';
      setToast({ type: 'error', message: `❌ ${errorMsg}` });
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
      maintenedUntil: '',
      nextMaintenanceDate: '',
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
      maintenedUntil: court.maintenedUntil ? court.maintenedUntil.slice(0, 16) : '',
      nextMaintenanceDate: court.nextMaintenanceDate ? court.nextMaintenanceDate.slice(0, 16) : '',
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
        gridTemplateColumns: 'repeat(2, minmax(auto, 1fr))', 
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

      {/* Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }} onClick={resetForm}>
          <div style={{
            background: G.card,
            border: `2px solid ${G.cardBorder}`,
            borderRadius: 16,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20, color: G.text }}>
              {editingId ? '✏️ Edit Court' : '➕ Add New Court'}
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Court Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '10px 12px', fontSize: 13 }}
                />
                <input
                  type="number"
                  placeholder="Court #"
                  value={formData.courtNumber}
                  onChange={(e) => setFormData({...formData, courtNumber: e.target.value})}
                  required
                  style={{ width: 90, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '10px 12px', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  value={formData.surface}
                  onChange={(e) => setFormData({...formData, surface: e.target.value})}
                  style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '10px 12px', fontSize: 13 }}
                >
                  <option value="Clay">Clay</option>
                  <option value="Hard">Hard</option>
                  <option value="Grass">Grass</option>
                </select>
                <select
                  value={formData.indoorOutdoor}
                  onChange={(e) => setFormData({...formData, indoorOutdoor: e.target.value})}
                  style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '10px 12px', fontSize: 13 }}
                >
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: G.text, fontSize: 13, flex: 1, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(formData.lights)}
                    onChange={(e) => setFormData({...formData, lights: e.target.checked})}
                    style={{ cursor: 'pointer' }}
                  />
                  Has Lights
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '10px 12px', fontSize: 13 }}
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: G.muted, fontWeight: 600 }}>Maintenance end</label>
                  <input
                    type="datetime-local"
                    value={formData.maintenedUntil}
                    onChange={(e) => setFormData({...formData, maintenedUntil: e.target.value})}
                    style={{ background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '10px 12px', fontSize: 13 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: G.muted, fontWeight: 600 }}>Next maintenance</label>
                  <input
                    type="datetime-local"
                    value={formData.nextMaintenanceDate}
                    onChange={(e) => setFormData({...formData, nextMaintenanceDate: e.target.value})}
                    style={{ background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 6, padding: '10px 12px', fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ 
                    flex: 1, 
                    background: G.lime, 
                    color: G.dark, 
                    border: 'none', 
                    borderRadius: 8, 
                    padding: '12px 16px', 
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Court' : 'Add Court'}
                </button>
                <button 
                  type="button" 
                  onClick={resetForm}
                  disabled={isSubmitting}
                  style={{ 
                    flex: 1, 
                    background: G.mid, 
                    color: G.text, 
                    border: `1px solid ${G.cardBorder}`, 
                    borderRadius: 8, 
                    padding: '12px 16px', 
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{ background: G.lime, color: G.dark, border: 'none', borderRadius: 8, padding: '12px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          ➕ Add New Court
        </button>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: toast.type === 'success' ? '#1a3520' : '#3a1a1a',
          border: `2px solid ${toast.type === 'success' ? G.lime : '#ff6b6b'}`,
          color: toast.type === 'success' ? G.lime : '#ff9b9b',
          padding: '14px 18px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          zIndex: 2000,
          animation: 'slideInRight 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}>
          {toast.message}
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
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
                    <span style={{ fontSize: 14, fontWeight: 700, color: G.lime }}>{court.surface}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>Type</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: G.lime }}>{court.indoorOutdoor}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>Lights</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: court.lights ? G.lime : G.muted }}>
                      {court.lights ? '💡 Yes' : 'No'}
                    </span>
                  </div>
                  {court.nextMaintenanceDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>Next Maint.</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: G.yellow }}>{new Date(court.nextMaintenanceDate).toLocaleString()}</span>
                    </div>
                  )}
                  {court.maintenedUntil && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>Maint. Until</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: G.yellow }}>{new Date(court.maintenedUntil).toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>Status</span>
                    <span style={{ 
                      fontSize: 13, 
                      fontWeight: 700, 
                      color: court.status === 'Active' ? G.lime : court.status === 'Maintenance' ? G.yellow : G.text,
                      background: court.status === 'Active' ? G.lime + '15' : court.status === 'Maintenance' ? G.yellow + '15' : G.cardBorder,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${court.status === 'Active' ? G.lime + '40' : court.status === 'Maintenance' ? G.yellow + '40' : G.cardBorder}`
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
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(court.id)}
                    style={{ 
                      flex: 1, 
                      background: 'transparent', 
                      color: G.lime, 
                      border: `2px solid ${G.cardBorder}`, 
                      borderRadius: 6, 
                      padding: '10px 12px', 
                      fontSize: 13, 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = G.lime;
                      e.currentTarget.style.background = G.lime + '15';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = G.cardBorder;
                      e.currentTarget.style.background = 'transparent';
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
