'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

const G = {
  dark: '#0f1f0f',
  sidebar: '#152515',
  card: '#1a3020',
  cardBorder: '#2d5a35',
  mid: '#2d5a27',
  bright: '#3d7a32',
  lime: '#7dc142',
  accent: '#a8d84e',
  text: '#e8f5e0',
  muted: '#7aaa6a',
  yellow: '#f0c040',
  red: '#ff6b6b',
  orange: '#f09040',
};

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Court {
  id: string;
  name: string;
  courtNumber: number;
  surface: string;
  indoorOutdoor: string;
  lights: boolean;
  status: string;
  maintenedUntil?: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields
  description?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
  width?: number;
  length?: number;
  maxCapacity?: number;
  peakHourStart?: string;
  peakHourEnd?: string;
  peakPrice?: number;
  offPeakPrice?: number;
  amenities?: string[];
  rules?: string[];
  availableDays?: string[];
  openTime?: string;
  closeTime?: string;
  nextMaintenanceDate?: string;
  lastInspectionDate?: string;
  yearBuilt?: number;
  renovationYear?: number;
  contactEmail?: string;
  contactPhone?: string;
}

interface CourtBooking {
  id: string;
  startTime: string;
  endTime: string;
  playerName?: string;
  guestCount: number;
  status: string;
  price?: number;
  isPeak: boolean;
  createdAt: string;
  member?: any;
}

interface CourtComment {
  id: string;
  content: string;
  rating?: number;
  createdAt: string;
  author: {
    userId: string;
    user: { firstName: string; lastName: string; photo?: string };
  };
}

interface CourtComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedNotes?: string;
  author: {
    userId: string;
    user: { firstName: string; lastName: string };
  };
}

interface CourtStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  revenue: number;
  averageRating?: number;
  complaintCount: number;
  resolvedComplaints: number;
  utilizationRate?: number;
  peakBookings?: number;
  offPeakBookings?: number;
  totalHoursBooked?: number;
  monthlyRevenue?: { month: string; revenue: number }[];
}

type TabId = 'overview' | 'bookings' | 'comments' | 'complaints' | 'statistics' | 'location' | 'images' | 'settings';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getStarRating = (rating?: number) => {
  if (!rating) return '☆☆☆☆☆';
  const full = Math.floor(rating);
  const partial = rating % 1 > 0.5 ? 1 : 0;
  return '★'.repeat(full + partial) + '☆'.repeat(5 - full - partial);
};

const statusColor = (status: string) => {
  if (['active', 'confirmed', 'resolved'].includes(status.toLowerCase())) return G.lime;
  if (['pending', 'maintenance', 'under_review'].includes(status.toLowerCase())) return G.yellow;
  return G.red;
};

const Badge: React.FC<{ label: string; color: string; bg?: string }> = ({ label, color, bg }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      color,
      background: bg || color + '22',
      border: `1px solid ${color}55`,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}
  >
    {label}
  </span>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      gap: 12,
      padding: '12px 0',
      borderBottom: `1px solid ${G.cardBorder}22`,
      alignItems: 'center',
    }}
  >
    <div style={{ fontSize: 13, color: G.muted, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>{value}</div>
  </div>
);

const StatCard: React.FC<{ label: string; value: React.ReactNode; sub?: string; color?: string }> = ({
  label, value, sub, color = G.lime,
}) => (
  <div style={{ background: G.card, border: `2px solid ${G.cardBorder}`, borderRadius: 12, padding: 20 }}>
    <div style={{ fontSize: 12, color: G.muted, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title, onClose, children,
}) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: '#00000088',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: G.card,
        border: `2px solid ${G.cardBorder}`,
        borderRadius: 16,
        padding: 28,
        minWidth: 400,
        maxWidth: 560,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: G.text }}>{title}</div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: G.muted, fontSize: 20, cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Image Upload Zone ────────────────────────────────────────────────────────

const ImageUploadBtn: React.FC<{ onUpload: (files: File[]) => void; imageCount?: number }> = ({
  onUpload, imageCount = 0,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onUpload(files);
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          background: G.lime,
          color: G.dark,
          border: 'none',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        📸 Add Photos {imageCount < 5 && `(${imageCount}/5)`}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
    </>
  );
};

// ─── Tabs config ─────────────────────────────────────────────────────────────

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'overview',    icon: '📋', label: 'Overview' },
  { id: 'bookings',   icon: '📅', label: 'Bookings' },
  { id: 'comments',   icon: '💬', label: 'Reviews' },
  { id: 'complaints', icon: '⚠️', label: 'Complaints' },
  { id: 'images',     icon: '🖼️', label: 'Images' },
  { id: 'location',   icon: '📍', label: 'Location' },
  { id: 'statistics', icon: '📊', label: 'Statistics' },
  { id: 'settings',   icon: '⚙️', label: 'Settings' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CourtDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { id: orgId, courtId } = params;

  const [court, setCourt] = useState<Court | null>(null);
  const [bookings, setBookings] = useState<CourtBooking[]>([]);
  const [comments, setComments] = useState<CourtComment[]>([]);
  const [complaints, setComplaints] = useState<CourtComplaint[]>([]);
  const [stats, setStats] = useState<CourtStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get active tab from URL, fallback to 'overview'
  const activeTab = (searchParams.get('tab') as TabId) || 'overview';
  const setActiveTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Image state
  const [images, setImages] = useState<Array<{ id: string; data: string; width: number; height: number; posX: number; posY: number; scale: number; notes?: string }>>([]);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [fullscreenImageId, setFullscreenImageId] = useState<string | null>(null);
  const [deleteConfirmImageId, setDeleteConfirmImageId] = useState<string | null>(null);
  const [imageNotesId, setImageNotesId] = useState<string | null>(null);
  const [imageNotes, setImageNotes] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);

  // Action modals
  const [modal, setModal] = useState<
    null | 'editCourt' | 'editStatus' | 'editPricing' | 'editSchedule' | 'editAmenities' | 'complaintResolve' | 'uploadImage'
  >(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<CourtComplaint | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  // Edit state
  const [editData, setEditData] = useState<Partial<Court>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (orgId && courtId) fetchCourtDetails();
  }, [orgId, courtId]);

  async function fetchCourtDetails() {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/courts/${courtId}`);
      if (!res.ok) throw new Error('Failed to fetch court details');
      const data = await res.json();
      setCourt(data.court);
      setBookings(data.bookings || []);
      setComments(data.comments || []);
      setComplaints(data.complaints || []);
      setStats(data.stats);
      
      // Fetch court images
      const imagesRes = await authenticatedFetch(`/api/organization/${orgId}/courts/${courtId}/images`);
      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        setImages(imagesData.images || []);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading court details');
    } finally {
      setLoading(false);
    }
  }

  async function handleBookingStatusChange(bookingId: string, newStatus: string) {
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/courts/${courtId}/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update booking');
      await fetchCourtDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating booking');
    }
  }

  async function handleComplaintStatusChange(complaintId: string, newStatus: string, notes?: string) {
    try {
      const res = await authenticatedFetch(
        `/api/organization/${orgId}/courts/${courtId}/complaints/${complaintId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, resolvedNotes: notes }),
        }
      );
      if (!res.ok) throw new Error('Failed to update complaint');
      await fetchCourtDetails();
      setModal(null);
      setSelectedComplaint(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating complaint');
    }
  }

  async function handleCourtUpdate(fields: Partial<Court>) {
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/courts/${courtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error('Failed to update court');
      await fetchCourtDetails();
      setModal(null);
      showSuccess('Court updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating court');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleImageUpload(files: File[]) {
    try {
      setActionLoading(true);
      const currentImageCount = images.length;
      const availableSlots = 5 - currentImageCount;

      if (currentImageCount >= 5) {
        showError('Maximum 5 images allowed. Please delete some images first.');
        setActionLoading(false);
        return;
      }

      const filesToUpload = files.slice(0, availableSlots);

      if (filesToUpload.length === 0) {
        showError(`Maximum 5 images allowed. You already have ${currentImageCount} image${currentImageCount !== 1 ? 's' : ''}.`);
        setActionLoading(false);
        return;
      }

      if (files.length > availableSlots) {
        showError(`Only ${availableSlots} slot${availableSlots !== 1 ? 's' : ''} available. ${files.length} file${files.length !== 1 ? 's' : ''} selected. Uploading first ${availableSlots}...`);
      }

      const imagesToUpload: typeof images = [];
      let loadedCount = 0;

      for (const file of filesToUpload) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          const img = new Image();
          img.onload = async () => {
            imagesToUpload.push({
              id: Math.random().toString(36).substr(2, 9),
              data: base64Data,
              width: img.naturalWidth,
              height: img.naturalHeight,
              posX: 0,
              posY: 0,
              scale: 1,
              notes: '',
            });
            loadedCount++;

            if (loadedCount === filesToUpload.length) {
              // Upload all images to backend
              try {
                const res = await authenticatedFetch(
                  `/api/organization/${orgId}/courts/${courtId}/images`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ images: imagesToUpload }),
                  }
                );
                if (!res.ok) throw new Error('Failed to upload images');
                const data = await res.json();
                setImages((prev) => [...prev, ...data.images]);
                showSuccess(`${filesToUpload.length} image${filesToUpload.length > 1 ? 's' : ''} uploaded successfully!`);
              } catch (err) {
                showError(err instanceof Error ? err.message : 'Error uploading images');
              } finally {
                setActionLoading(false);
              }
            }
          };
          img.onerror = () => {
            showError('Failed to load one or more images. Please try again.');
            setActionLoading(false);
          };
          img.src = base64Data;
        };
        reader.onerror = () => {
          showError('Failed to read file. Please try again.');
          setActionLoading(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error uploading images');
      setActionLoading(false);
    }
  }

  async function handleImageUpdate(imageId: string, posX: number, posY: number, scale: number) {
    try {
      const res = await authenticatedFetch(
        `/api/organization/${orgId}/courts/${courtId}/images`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId, posX, posY, scale }),
        }
      );
      if (!res.ok) throw new Error('Failed to update image');
      
      // Update local state
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === imageId ? { ...img, posX, posY, scale } : img
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating image');
    }
  }

  function openImageDeleteConfirm(imageId: string) {
    setDeleteConfirmImageId(imageId);
  }

  async function confirmImageDelete() {
    if (!deleteConfirmImageId) return;
    try {
      const res = await authenticatedFetch(
        `/api/organization/${orgId}/courts/${courtId}/images`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: deleteConfirmImageId }),
        }
      );
      if (!res.ok) throw new Error('Failed to delete image');
      
      setImages((prevImages) => prevImages.filter((img) => img.id !== deleteConfirmImageId));
      setSelectedImageForEdit(null);
      setDeleteConfirmImageId(null);
      showSuccess('Image deleted successfully');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error deleting image');
    }
  }

  async function handleImageDelete(imageId: string) {
    openImageDeleteConfirm(imageId);
  }

  function openImageNotes(imageId: string) {
    const img = images.find((i) => i.id === imageId);
    if (img) {
      setImageNotesId(imageId);
      setImageNotes(img.notes || '');
    }
  }

  async function saveImageNotes() {
    if (!imageNotesId) return;
    try {
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === imageNotesId ? { ...img, notes: imageNotes } : img
        )
      );
      setImageNotesId(null);
      setImageNotes('');
      showSuccess('Image notes saved');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Error saving notes');
    }
  }

  async function handleDeleteCourt() {
    if (!confirm('Are you sure you want to delete this court? This action cannot be undone.')) return;
    try {
      setActionLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/courts/${courtId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete court');
      window.history.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting court');
      setActionLoading(false);
    }
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  function showError(msg: string) {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  }

  function openEdit(section: typeof modal) {
    if (court) setEditData({ ...court });
    setModal(section);
  }

  // ─── Loading / Error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: 32, background: G.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div style={{ color: G.muted, fontSize: 16, fontWeight: 600 }}>Loading court details…</div>
        </div>
      </div>
    );
  }

  if (error || !court) {
    return (
      <div style={{ padding: 32, background: G.dark, minHeight: '100vh' }}>
        <div style={{ color: G.red, fontSize: 16 }}>Error: {error || 'Court not found'}</div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 32px', background: G.dark, minHeight: '100vh' }}>
      <div style={{ margin: '0 auto' }}>

        {/* Toast */}
        {successMsg && (
          <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 2000,
            background: G.lime, color: G.dark, borderRadius: 10,
            padding: '12px 20px', fontWeight: 700, fontSize: 14,
            boxShadow: '0 8px 32px #7dc14266',
          }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Error Toast */}
        {errorMsg && (
          <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 2000,
            background: G.red, color: '#fff', borderRadius: 10,
            padding: '12px 20px', fontWeight: 700, fontSize: 14,
            boxShadow: '0 8px 32px #ff6b6b66',
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmImageId !== null && (
          <Modal title="🗑️ Delete Image?" onClose={() => setDeleteConfirmImageId(null)}>
            <div style={{ marginBottom: 20 }}>
              <p style={{ marginTop: 0, color: G.text }}>Are you sure you want to delete this image? This cannot be undone.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmImageId(null)}
                style={{
                  padding: '10px 20px', border: `1px solid ${G.cardBorder}`, background: G.dark,
                  color: G.text, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
                onMouseEnter={e => e.currentTarget.style.background = G.mid}
                onMouseLeave={e => e.currentTarget.style.background = G.dark}
              >
                Cancel
              </button>
              <button
                onClick={confirmImageDelete}
                style={{
                  padding: '10px 20px', background: G.red, color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Delete
              </button>
            </div>
          </Modal>
        )}

        {/* Image Notes Modal */}
        {imageNotesId !== null && (
          <Modal title="📝 Image Notes" onClose={() => setImageNotesId(null)}>
            <div style={{ marginBottom: 20 }}>
              <textarea
                value={imageNotes}
                onChange={e => setImageNotes(e.target.value)}
                placeholder="Add notes about this image..."
                style={{
                  width: '100%', minHeight: 120, padding: 12, borderRadius: 6,
                  border: `1px solid ${G.cardBorder}`, background: G.card, color: G.text,
                  fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setImageNotesId(null)}
                style={{
                  padding: '10px 20px', border: `1px solid ${G.cardBorder}`, background: G.dark,
                  color: G.text, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
                onMouseEnter={e => e.currentTarget.style.background = G.mid}
                onMouseLeave={e => e.currentTarget.style.background = G.dark}
              >
                Cancel
              </button>
              <button
                onClick={saveImageNotes}
                style={{
                  padding: '10px 20px', background: G.lime, color: G.dark,
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Save Notes
              </button>
            </div>
          </Modal>
        )}

        {/* Back */}
        <button
          onClick={() => window.history.back()}
          style={{ background: 'transparent', color: G.lime, border: 'none', fontSize: 14, cursor: 'pointer', marginBottom: 16, fontWeight: 700 }}
        >
          ← Back to Courts
        </button>

        {/* Header + Actions */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 900, color: G.text, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                🎾 {court.name}
                <Badge
                  label={court.status}
                  color={statusColor(court.status)}
                />
              </div>
              <div style={{ fontSize: 13, color: G.muted, fontWeight: 600, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>Court #{court.courtNumber}</span>
                <span>•</span>
                <span>{court.surface}</span>
                <span>•</span>
                <span>{court.indoorOutdoor}</span>
                {court.city && <><span>•</span><span>📍 {court.city}</span></>}
                {court.lights && <><span>•</span><span>💡 Lights</span></>}
              </div>
            </div>
            {/* Quick Actions Row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <ActionBtn icon="✏️" label="Edit Info" onClick={() => openEdit('editCourt')} color={G.lime} />
              <ActionBtn icon="🔄" label="Change Status" onClick={() => openEdit('editStatus')} color={G.yellow} />
              <ActionBtn icon="💰" label="Pricing" onClick={() => openEdit('editPricing')} color={G.accent} />
              <ActionBtn icon="🗓️" label="Schedule" onClick={() => openEdit('editSchedule')} color={G.bright} />
              <ActionBtn icon="🗑️" label="Delete" onClick={handleDeleteCourt} color={G.red} />
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard label="Total Bookings" value={stats?.totalBookings ?? 0} sub={`${stats?.confirmedBookings ?? 0} confirmed`} />
          <StatCard label="Total Revenue" value={`KES ${(stats?.revenue ?? 0).toLocaleString()}`} color={G.accent} />
          <StatCard label="Avg Rating" value={stats?.averageRating ? `${stats.averageRating.toFixed(1)} ★` : 'N/A'} color={G.yellow} />
          <StatCard label="Utilization" value={stats?.utilizationRate ? `${stats.utilizationRate}%` : 'N/A'} sub="of available hours" color={G.bright} />
          <StatCard label="Complaints" value={stats?.complaintCount ?? 0} sub={`${stats?.resolvedComplaints ?? 0} resolved`} color={stats?.complaintCount ? G.red : G.bright} />
          <StatCard label="Hours Booked" value={stats?.totalHoursBooked ?? 0} sub="all time" color={G.muted} />
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: 24, borderBottom: `2px solid ${G.cardBorder}` }}>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '14px 18px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `3px solid ${G.lime}` : '3px solid transparent',
                  color: activeTab === tab.id ? G.lime : G.muted,
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 900 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                  marginBottom: -2,
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Basic Info */}
            <Section title="🏷️ Court Information" action={{ label: 'Edit', onClick: () => openEdit('editCourt') }}>
              <InfoRow label="Court Name" value={court.name} />
              <InfoRow label="Court Number" value={`#${court.courtNumber}`} />
              <InfoRow label="Surface Type" value={<Badge label={court.surface} color={G.accent} />} />
              <InfoRow label="Indoor / Outdoor" value={<Badge label={court.indoorOutdoor} color={G.muted} />} />
              <InfoRow label="Lights Available" value={court.lights ? <Badge label="Yes" color={G.lime} /> : <Badge label="No" color={G.red} />} />
              <InfoRow label="Status" value={<Badge label={court.status} color={statusColor(court.status)} />} />
              {court.yearBuilt && <InfoRow label="Year Built" value={court.yearBuilt} />}
              {court.renovationYear && <InfoRow label="Last Renovation" value={court.renovationYear} />}
              {court.maxCapacity && <InfoRow label="Max Capacity" value={`${court.maxCapacity} players`} />}
              {court.width && court.length && (
                <InfoRow label="Dimensions" value={`${court.width}m × ${court.length}m`} />
              )}
              <InfoRow label="Created" value={new Date(court.createdAt).toLocaleDateString()} />
              <InfoRow label="Last Updated" value={new Date(court.updatedAt).toLocaleDateString()} />
            </Section>

            {/* Pricing & Schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Section title="💰 Pricing" action={{ label: 'Edit', onClick: () => openEdit('editPricing') }}>
                {court.peakPrice !== undefined && (
                  <InfoRow label="Peak Hour Rate" value={<span style={{ color: G.accent, fontWeight: 900 }}>KES {court.peakPrice?.toLocaleString()}/hr</span>} />
                )}
                {court.offPeakPrice !== undefined && (
                  <InfoRow label="Off-Peak Rate" value={<span style={{ color: G.lime, fontWeight: 900 }}>KES {court.offPeakPrice?.toLocaleString()}/hr</span>} />
                )}
                {court.peakHourStart && court.peakHourEnd && (
                  <InfoRow label="Peak Hours" value={`${court.peakHourStart} – ${court.peakHourEnd}`} />
                )}
              </Section>

              <Section title="🗓️ Schedule" action={{ label: 'Edit', onClick: () => openEdit('editSchedule') }}>
                {court.openTime && court.closeTime && (
                  <InfoRow label="Operating Hours" value={`${court.openTime} – ${court.closeTime}`} />
                )}
                {court.availableDays && court.availableDays.length > 0 && (
                  <InfoRow label="Available Days" value={
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
                        <span key={d} style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                          background: court.availableDays?.includes(d) ? G.lime + '33' : G.cardBorder + '33',
                          color: court.availableDays?.includes(d) ? G.lime : G.muted,
                          border: `1px solid ${court.availableDays?.includes(d) ? G.lime + '55' : G.cardBorder}`,
                        }}>{d}</span>
                      ))}
                    </div>
                  } />
                )}
              </Section>

              <Section title="🔧 Maintenance" action={{ label: 'Edit', onClick: () => openEdit('editCourt') }}>
                {court.lastInspectionDate && (
                  <InfoRow label="Last Inspection" value={new Date(court.lastInspectionDate).toLocaleDateString()} />
                )}
                {court.nextMaintenanceDate && (
                  <InfoRow label="Next Maintenance" value={
                    <span style={{ color: G.yellow }}>{new Date(court.nextMaintenanceDate).toLocaleDateString()}</span>
                  } />
                )}
                {court.maintenedUntil && (
                  <InfoRow label="Maintained Until" value={new Date(court.maintenedUntil).toLocaleDateString()} />
                )}
              </Section>
            </div>

            {/* Description */}
            {court.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <Section title="📝 Description">
                  <p style={{ fontSize: 14, color: G.text, lineHeight: 1.7, margin: 0 }}>{court.description}</p>
                </Section>
              </div>
            )}

            {/* Amenities */}
            {court.amenities && court.amenities.length > 0 && (
              <Section title="✨ Amenities" action={{ label: 'Edit', onClick: () => openEdit('editAmenities') }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 8 }}>
                  {court.amenities.map((a) => (
                    <Badge key={a} label={a} color={G.accent} />
                  ))}
                </div>
              </Section>
            )}

            {/* Rules */}
            {court.rules && court.rules.length > 0 && (
              <Section title="📜 Court Rules">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {court.rules.map((r, i) => (
                    <li key={i} style={{ fontSize: 13, color: G.text, marginBottom: 6, lineHeight: 1.5 }}>{r}</li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Contact */}
            {(court.contactEmail || court.contactPhone) && (
              <Section title="📞 Contact">
                {court.contactEmail && <InfoRow label="Email" value={<a href={`mailto:${court.contactEmail}`} style={{ color: G.lime }}>{court.contactEmail}</a>} />}
                {court.contactPhone && <InfoRow label="Phone" value={<a href={`tel:${court.contactPhone}`} style={{ color: G.lime }}>{court.contactPhone}</a>} />}
              </Section>
            )}
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {activeTab === 'bookings' && (
          <Section title={`📅 Bookings (${bookings.length})`}>
            <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingRight: 8 }}>
              {bookings.length === 0 ? (
                <EmptyState icon="📅" message="No bookings yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      style={{
                        background: G.dark,
                        border: `1px solid ${G.cardBorder}`,
                        borderRadius: 10,
                        padding: 16,
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px 100px 180px',
                        gap: 16,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 4 }}>
                          {booking.member?.player?.user?.firstName} {booking.member?.player?.user?.lastName || 'Guest'}
                        </div>
                        <div style={{ fontSize: 12, color: G.muted }}>
                          {new Date(booking.startTime).toLocaleDateString()} · {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {booking.price && (
                          <div style={{ fontSize: 12, color: G.accent, marginTop: 4, fontWeight: 700 }}>KES {booking.price.toLocaleString()}</div>
                        )}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: G.muted }}>Guests</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: G.text }}>{booking.guestCount}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        {booking.isPeak && <Badge label="Peak" color={G.yellow} />}
                      </div>
                      <select
                        value={booking.status}
                        onChange={(e) => handleBookingStatusChange(booking.id, e.target.value)}
                        style={selectStyle}
                      >
                        <option value="confirmed">✅ Confirmed</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── REVIEWS ── */}
        {activeTab === 'comments' && (
          <Section title={`💬 Reviews (${comments.length})`}>
            <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingRight: 8 }}>
              {comments.length === 0 ? (
                <EmptyState icon="💬" message="No reviews yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Rating summary */}
                  {stats?.averageRating && (
                    <div style={{ background: G.dark, borderRadius: 10, padding: 20, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 40, fontWeight: 900, color: G.yellow }}>{stats.averageRating.toFixed(1)}</div>
                        <div style={{ fontSize: 18, color: G.yellow }}>{getStarRating(stats.averageRating)}</div>
                        <div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>{comments.length} reviews</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = comments.filter((c) => c.rating && Math.round(c.rating) === star).length;
                          const pct = comments.length > 0 ? (count / comments.length) * 100 : 0;
                          return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: G.muted, width: 20 }}>{star}★</span>
                              <div style={{ flex: 1, height: 6, background: G.cardBorder, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: G.yellow, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, color: G.muted, width: 20 }}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {comments.map((comment) => (
                    <div key={comment.id} style={{ background: G.dark, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>
                          {comment.author.user.firstName} {comment.author.user.lastName}
                        </div>
                        {comment.rating && (
                          <div style={{ fontSize: 14, color: G.yellow }}>{getStarRating(comment.rating)} <span style={{ fontSize: 12, color: G.muted }}>({comment.rating})</span></div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>{new Date(comment.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: 13, color: G.text, lineHeight: 1.6 }}>{comment.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── COMPLAINTS ── */}
        {activeTab === 'complaints' && (
          <Section title={`⚠️ Complaints (${complaints.length})`}>
            <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingRight: 8 }}>
              {complaints.length === 0 ? (
                <EmptyState icon="✅" message="No complaints — court is running smoothly!" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {complaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      style={{
                        background: G.dark,
                        border: `2px solid ${complaint.status === 'pending' ? G.red : complaint.status === 'resolved' ? G.lime : G.yellow}`,
                        borderRadius: 10,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 4 }}>{complaint.title}</div>
                          <div style={{ fontSize: 11, color: G.muted }}>
                            {complaint.author.user.firstName} {complaint.author.user.lastName} · {new Date(complaint.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Badge label={complaint.severity} color={complaint.severity === 'high' ? G.red : complaint.severity === 'medium' ? G.yellow : G.bright} />
                          <Badge label={complaint.status} color={statusColor(complaint.status)} />
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: G.text, lineHeight: 1.5, marginBottom: 10 }}>{complaint.description}</div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 10 }}>Category: {complaint.category}</div>
                      {complaint.resolvedNotes && (
                        <div style={{ background: G.mid, borderRadius: 6, padding: 10, marginBottom: 10, fontSize: 12, color: G.text }}>
                          <div style={{ fontWeight: 700, color: G.lime, marginBottom: 4 }}>Resolution Notes:</div>
                          {complaint.resolvedNotes}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select
                          value={complaint.status}
                          onChange={(e) => handleComplaintStatusChange(complaint.id, e.target.value)}
                          style={{ ...selectStyle, flex: 1 }}
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="under_review">🔍 Under Review</option>
                          <option value="resolved">✅ Resolved</option>
                          <option value="dismissed">❌ Dismissed</option>
                        </select>
                        <button
                          onClick={() => { setSelectedComplaint(complaint); setResolveNotes(complaint.resolvedNotes || ''); setModal('complaintResolve'); }}
                          style={{ ...btnStyle, background: G.mid, color: G.lime }}
                        >
                          📝 Add Notes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── LOCATION ── */}
        {activeTab === 'location' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="📍 Address Details" action={{ label: 'Edit', onClick: () => openEdit('editCourt') }}>
              {court.address && <InfoRow label="Street Address" value={court.address} />}
              {court.city && <InfoRow label="City" value={court.city} />}
              {court.country && <InfoRow label="Country" value={court.country} />}
              {court.latitude && <InfoRow label="Latitude" value={court.latitude} />}
              {court.longitude && <InfoRow label="Longitude" value={court.longitude} />}
              {court.latitude && court.longitude && (
                <div style={{ marginTop: 12 }}>
                  <a
                    href={`https://www.google.com/maps?q=${court.latitude},${court.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...btnStyle, background: G.bright, color: G.text, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                  >
                    🗺️ Open in Google Maps
                  </a>
                </div>
              )}
            </Section>

            {/* Map placeholder */}
            <Section title="🗺️ Map">
              {court.latitude && court.longitude ? (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                  <iframe
                    title="Court Location"
                    width="100%"
                    height="280"
                    frameBorder="0"
                    style={{ borderRadius: 10, border: `1px solid ${G.cardBorder}` }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${court.longitude - 0.005},${court.latitude - 0.005},${court.longitude + 0.005},${court.latitude + 0.005}&layer=mapnik&marker=${court.latitude},${court.longitude}`}
                  />
                </div>
              ) : (
                <EmptyState icon="🗺️" message="No coordinates set. Add latitude & longitude to show map." />
              )}
            </Section>
          </div>
        )}

        {/* ── STATISTICS ── */}
        {activeTab === 'statistics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Booking Distribution */}
            <Section title="📊 Booking Distribution">
              {[
                { label: 'Confirmed', value: stats?.confirmedBookings ?? 0, color: G.lime },
                { label: 'Cancelled', value: stats?.cancelledBookings ?? 0, color: G.red },
                { label: 'Peak Bookings', value: stats?.peakBookings ?? 0, color: G.yellow },
                { label: 'Off-Peak Bookings', value: stats?.offPeakBookings ?? 0, color: G.muted },
              ].map(({ label, value, color }) => {
                const pct = stats?.totalBookings && stats.totalBookings > 0 ? (value / stats.totalBookings) * 100 : 0;
                return (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: G.muted }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{value} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: 8, background: G.cardBorder, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </Section>

            {/* Revenue */}
            <Section title="💰 Revenue">
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Total Revenue</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: G.accent }}>KES {(stats?.revenue ?? 0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Avg per Booking</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: G.lime }}>
                    KES {stats?.totalBookings && stats.totalBookings > 0 ? ((stats.revenue ?? 0) / stats.totalBookings).toFixed(0) : 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Total Hours Booked</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: G.bright }}>{stats?.totalHoursBooked ?? 0} hrs</div>
                </div>
              </div>
            </Section>

            {/* Complaints */}
            <Section title="⚠️ Complaint Summary">
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Total Complaints</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: G.red }}>{stats?.complaintCount ?? 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Resolved</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: G.lime }}>{stats?.resolvedComplaints ?? 0}</div>
                </div>
                {stats?.complaintCount && stats.complaintCount > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Resolution Rate</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: G.bright }}>
                      {((stats.resolvedComplaints / stats.complaintCount) * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Section title="⚙️ Court Actions">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SettingsAction
                    icon="✏️"
                    label="Edit Court Info"
                    description="Update name, surface, dimensions, and other details"
                    onClick={() => openEdit('editCourt')}
                    color={G.lime}
                  />
                  <SettingsAction
                    icon="🔄"
                    label="Change Court Status"
                    description={`Current: ${court.status}`}
                    onClick={() => openEdit('editStatus')}
                    color={G.yellow}
                  />
                  <SettingsAction
                    icon="💰"
                    label="Update Pricing"
                    description="Set peak and off-peak rates"
                    onClick={() => openEdit('editPricing')}
                    color={G.accent}
                  />
                  <SettingsAction
                    icon="🗓️"
                    label="Manage Schedule"
                    description="Set operating hours and available days"
                    onClick={() => openEdit('editSchedule')}
                    color={G.bright}
                  />
                  <SettingsAction
                    icon="✨"
                    label="Edit Amenities & Rules"
                    description="Update available amenities and court rules"
                    onClick={() => openEdit('editAmenities')}
                    color={G.muted}
                  />
                </div>
              </Section>

              <Section title="🗑️ Danger Zone">
                <div style={{ padding: 16, border: `2px solid ${G.red}44`, borderRadius: 10, background: G.red + '11' }}>
                  <div style={{ fontSize: 14, color: G.text, fontWeight: 700, marginBottom: 6 }}>Delete this Court</div>
                  <div style={{ fontSize: 12, color: G.muted, marginBottom: 14, lineHeight: 1.5 }}>
                    Once deleted, all bookings, comments, and complaints associated with this court will be permanently removed. This action cannot be undone.
                  </div>
                  <button
                    onClick={handleDeleteCourt}
                    disabled={actionLoading}
                    style={{ ...btnStyle, background: G.red, color: '#fff', fontWeight: 900 }}
                  >
                    🗑️ Delete Court Permanently
                  </button>
                </div>
              </Section>
            </div>

          </div>
        )}

        {/* ── IMAGES ── */}
        {activeTab === 'images' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Section title="🖼️ Court Images Gallery" action={{ label: images.length < 5 ? 'Add More' : '', onClick: () => document.getElementById('imageUploadInput')?.click() }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Upload Button */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <ImageUploadBtn onUpload={handleImageUpload} imageCount={images.length} />
                  <input 
                    id="imageUploadInput"
                    type="file" 
                    accept="image/*" 
                    multiple 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) handleImageUpload(files);
                    }}
                  />
                  <div style={{ fontSize: 12, color: G.muted, display: 'flex', alignItems: 'center' }}>
                    PNG, JPG, WEBP — Up to 5 images | Click image to add notes
                  </div>
                </div>

                {/* Gallery Grid - Full Width */}
                {images.length === 0 ? (
                  <EmptyState icon="📸" message="No images uploaded yet" />
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(5, 1fr)`,
                    gap: 16,
                    width: '100%',
                  }}>
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        onDoubleClick={() => setFullscreenImageId(img.id)}
                        onClick={() => openImageNotes(img.id)}
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: `1px solid ${G.cardBorder}`,
                          background: G.dark,
                          cursor: 'pointer',
                        }}
                        title="Click to add notes | Double-click to view fullscreen"
                      >
                        <img
                          src={img.data}
                          alt={`Court ${idx + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: `translate(${img.posX}px, ${img.posY}px) scale(${img.scale})`,
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: G.dark + '00',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = G.dark + 'cc'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0'; (e.currentTarget as HTMLElement).style.background = G.dark + '00'; }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); setFullscreenImageId(img.id); }}
                            style={{
                              background: G.lime,
                              color: G.dark,
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 10px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            title="View fullscreen"
                          >
                            🔍 Fullscreen
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleImageDelete(img.id); }}
                            style={{
                              background: G.red,
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 10px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            background: G.dark + 'dd',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 10,
                            color: G.text,
                            fontWeight: 700,
                          }}
                        >
                          {idx + 1}/{images.length}
                        </div>
                        {img.notes && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 4,
                              left: 4,
                              right: 4,
                              background: G.lime + 'ee',
                              borderRadius: 4,
                              padding: '6px 8px',
                              fontSize: 10,
                              color: G.dark,
                              fontWeight: 700,
                              maxHeight: '40%',
                              overflowY: 'auto',
                              lineHeight: '1.3',
                              wordBreak: 'break-word',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              border: `1px solid ${G.dark}`,
                            }}
                          >
                            <div style={{ marginBottom: 2, fontWeight: 900, fontSize: 9 }}>📝 NOTE #{idx + 1}</div>
                            <div>{img.notes}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

          </div>
        )}

        {/* Fullscreen Image Viewer Modal */}
        {fullscreenImageId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              background: '#000000dd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setFullscreenImageId(null)}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                borderRadius: 12,
                overflow: 'hidden',
                border: `2px solid ${G.cardBorder}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const img = images.find((i) => i.id === fullscreenImageId);
                const idx = images.findIndex((i) => i.id === fullscreenImageId);
                return img ? (
                  <>
                    <img
                      src={img.data}
                      alt="Full"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        maxHeight: '85vh',
                        maxWidth: '85vw',
                      }}
                    />
                    <button
                      onClick={() => setFullscreenImageId(null)}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: G.dark,
                        border: `1px solid ${G.cardBorder}`,
                        color: G.lime,
                        fontSize: 24,
                        borderRadius: 8,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => { openImageNotes(img.id); setFullscreenImageId(null); }}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 60,
                        background: G.lime,
                        border: `1px solid ${G.cardBorder}`,
                        color: G.dark,
                        fontSize: 14,
                        borderRadius: 8,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                      title="Add or edit notes for this image"
                    >
                      📝 Notes
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: G.dark + 'cc',
                        color: G.text,
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        border: `1px solid ${G.cardBorder}`,
                      }}
                    >
                      {idx + 1}/{images.length}
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          </div>
        )}

      </div>

      {/* ── Modals ── */}

      {modal === 'editCourt' && (
        <Modal title="✏️ Edit Court Info" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormField label="Court Name">
              <input style={inputStyle} value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
            </FormField>
            <FormField label="Surface Type">
              <select style={inputStyle} value={editData.surface || ''} onChange={(e) => setEditData({ ...editData, surface: e.target.value })}>
                <option value="Clay">Clay</option>
                <option value="Hard">Hard</option>
                <option value="Grass">Grass</option>
                <option value="Carpet">Carpet</option>
                <option value="Artificial Grass">Artificial Grass</option>
              </select>
            </FormField>
            <FormField label="Indoor / Outdoor">
              <select style={inputStyle} value={editData.indoorOutdoor || ''} onChange={(e) => setEditData({ ...editData, indoorOutdoor: e.target.value })}>
                <option value="Indoor">Indoor</option>
                <option value="Outdoor">Outdoor</option>
              </select>
            </FormField>
            <FormField label="Lights">
              <select style={inputStyle} value={editData.lights ? 'true' : 'false'} onChange={(e) => setEditData({ ...editData, lights: e.target.value === 'true' })}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </FormField>
            <FormField label="Address">
              <input style={inputStyle} value={editData.address || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
            </FormField>
            <FormField label="City">
              <input style={inputStyle} value={editData.city || ''} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="Width (m)">
                <input type="number" style={inputStyle} value={editData.width || ''} onChange={(e) => setEditData({ ...editData, width: Number(e.target.value) })} />
              </FormField>
              <FormField label="Length (m)">
                <input type="number" style={inputStyle} value={editData.length || ''} onChange={(e) => setEditData({ ...editData, length: Number(e.target.value) })} />
              </FormField>
            </div>
            <FormField label="Description">
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
            </FormField>
            <FormField label="Next Maintenance Date">
              <input type="date" style={inputStyle} value={editData.nextMaintenanceDate?.split('T')[0] || ''} onChange={(e) => setEditData({ ...editData, nextMaintenanceDate: e.target.value })} />
            </FormField>
            <button onClick={() => handleCourtUpdate(editData)} disabled={actionLoading} style={{ ...btnStyle, background: G.lime, color: G.dark, fontWeight: 900 }}>
              {actionLoading ? 'Saving…' : '✅ Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'editStatus' && (
        <Modal title="🔄 Change Court Status" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Active', 'Maintenance', 'Inactive', 'Closed'].map((s) => (
              <button
                key={s}
                onClick={() => handleCourtUpdate({ status: s })}
                style={{
                  ...btnStyle,
                  background: court.status === s ? statusColor(s) + '33' : G.mid,
                  color: statusColor(s),
                  border: `2px solid ${court.status === s ? statusColor(s) : G.cardBorder}`,
                  fontWeight: 900,
                  textAlign: 'left',
                }}
              >
                {s === 'Active' ? '✅' : s === 'Maintenance' ? '🔧' : s === 'Inactive' ? '⏸️' : '🔒'} {s}
                {court.status === s && ' (Current)'}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal === 'editPricing' && (
        <Modal title="💰 Update Pricing" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormField label="Peak Hour Rate (KES/hr)">
              <input type="number" style={inputStyle} value={editData.peakPrice || ''} onChange={(e) => setEditData({ ...editData, peakPrice: Number(e.target.value) })} />
            </FormField>
            <FormField label="Off-Peak Rate (KES/hr)">
              <input type="number" style={inputStyle} value={editData.offPeakPrice || ''} onChange={(e) => setEditData({ ...editData, offPeakPrice: Number(e.target.value) })} />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="Peak Start Time">
                <input type="time" style={inputStyle} value={editData.peakHourStart || ''} onChange={(e) => setEditData({ ...editData, peakHourStart: e.target.value })} />
              </FormField>
              <FormField label="Peak End Time">
                <input type="time" style={inputStyle} value={editData.peakHourEnd || ''} onChange={(e) => setEditData({ ...editData, peakHourEnd: e.target.value })} />
              </FormField>
            </div>
            <button onClick={() => handleCourtUpdate(editData)} disabled={actionLoading} style={{ ...btnStyle, background: G.lime, color: G.dark, fontWeight: 900 }}>
              {actionLoading ? 'Saving…' : '✅ Save Pricing'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'editSchedule' && (
        <Modal title="🗓️ Manage Schedule" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="Open Time">
                <input type="time" style={inputStyle} value={editData.openTime || ''} onChange={(e) => setEditData({ ...editData, openTime: e.target.value })} />
              </FormField>
              <FormField label="Close Time">
                <input type="time" style={inputStyle} value={editData.closeTime || ''} onChange={(e) => setEditData({ ...editData, closeTime: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Available Days">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => {
                  const selected = editData.availableDays?.includes(d) ?? false;
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        const days = editData.availableDays || [];
                        setEditData({ ...editData, availableDays: selected ? days.filter((x) => x !== d) : [...days, d] });
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: 6, border: `1px solid ${selected ? G.lime : G.cardBorder}`,
                        background: selected ? G.lime + '22' : 'transparent',
                        color: selected ? G.lime : G.muted,
                        fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </FormField>
            <button onClick={() => handleCourtUpdate(editData)} disabled={actionLoading} style={{ ...btnStyle, background: G.lime, color: G.dark, fontWeight: 900 }}>
              {actionLoading ? 'Saving…' : '✅ Save Schedule'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'complaintResolve' && selectedComplaint && (
        <Modal title="📝 Complaint Notes" onClose={() => { setModal(null); setSelectedComplaint(null); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, color: G.text, background: G.dark, borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{selectedComplaint.title}</div>
              <div style={{ color: G.muted }}>{selectedComplaint.description}</div>
            </div>
            <FormField label="Resolution Notes">
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Describe how this complaint was addressed…"
              />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => handleComplaintStatusChange(selectedComplaint.id, 'resolved', resolveNotes)} style={{ ...btnStyle, background: G.lime, color: G.dark, fontWeight: 900 }}>
                ✅ Mark Resolved
              </button>
              <button onClick={() => handleComplaintStatusChange(selectedComplaint.id, 'dismissed', resolveNotes)} style={{ ...btnStyle, background: G.red + '33', color: G.red, border: `1px solid ${G.red}55`, fontWeight: 900 }}>
                ❌ Dismiss
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Small Sub-components ─────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode; action?: { label: string; onClick: () => void } }> = ({
  title, children, action,
}) => (
  <div style={{ background: G.card, border: `2px solid ${G.cardBorder}`, borderRadius: 12, padding: 22 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>{title}</div>
      {action && (
        <button onClick={action.onClick} style={{ background: 'transparent', border: `1px solid ${G.cardBorder}`, color: G.lime, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {action.label}
        </button>
      )}
    </div>
    {children}
  </div>
);

const EmptyState: React.FC<{ icon: string; message: string }> = ({ icon, message }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px', color: G.muted }}>
    <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 14, fontWeight: 600 }}>{message}</div>
  </div>
);

const ActionBtn: React.FC<{ icon: string; label: string; onClick: () => void; color: string }> = ({
  icon, label, onClick, color,
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 14px',
      background: color + '22',
      border: `1px solid ${color}55`,
      borderRadius: 8,
      color,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}
  >
    {icon} {label}
  </button>
);

const SettingsAction: React.FC<{ icon: string; label: string; description: string; onClick: () => void; color: string }> = ({
  icon, label, description, onClick, color,
}) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: 14,
      background: G.dark,
      border: `1px solid ${G.cardBorder}`,
      borderRadius: 10,
      cursor: 'pointer',
    }}
  >
    <div style={{ fontSize: 22 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{label}</div>
      <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{description}</div>
    </div>
    <div style={{ color: G.muted, fontSize: 16 }}>›</div>
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label style={{ fontSize: 12, color: G.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

// ─── Shared Styles ────────────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  background: G.mid,
  color: G.text,
  border: `1px solid ${G.cardBorder}`,
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: G.dark,
  color: G.text,
  border: `1px solid ${G.cardBorder}`,
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  fontSize: 13,
  cursor: 'pointer',
  fontWeight: 700,
};
