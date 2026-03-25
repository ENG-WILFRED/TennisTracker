'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateProfile } from '@/actions/auth';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040', red: '#dc2626',
};

interface ProfileViewProps {
  onClose?: () => void;
  isEmbedded?: boolean;
  canEdit?: boolean;
}

export function ProfileView({ onClose, isEmbedded = false, canEdit = false }: ProfileViewProps) {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userIdFromURL = (params?.id as string) || authUser?.id;

  const [profileData, setProfileData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!userIdFromURL) return;
      try {
        const profile = await getUserProfile(userIdFromURL);
        setProfileData(profile);
        setFormData({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone || '',
          gender: profile.gender || '',
          nationality: profile.nationality || '',
          bio: profile.bio || '',
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
          photo: profile.photo || '',
        });
        setPhotoPreview(profile.photo);
      } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userIdFromURL]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhotoPreview(dataUrl);
        setFormData((prev: any) => ({ ...prev, photo: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!userIdFromURL) return;

    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim()) {
      showToast('error', 'First name, last name, and email are required');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(userIdFromURL, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        gender: formData.gender || undefined,
        nationality: formData.nationality || undefined,
        bio: formData.bio || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        photo: formData.photo !== profileData?.photo ? formData.photo : undefined,
      });

      setProfileData(updated);
      setPhotoPreview(updated.photo);
      setIsEditing(false);
      showToast('success', 'Profile updated successfully!');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone || '',
        gender: profileData.gender || '',
        nationality: profileData.nationality || '',
        bio: profileData.bio || '',
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
        photo: profileData.photo || '',
      });
      setPhotoPreview(profileData.photo);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: G.text }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 20 }}>⏳</div>
          <div>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: G.text }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 20 }}>❌</div>
          <div>Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', background: isEmbedded ? 'linear-gradient(to bottom right, #0f2710, #0f1f0f, #0d1f0d)' : undefined, padding: isEmbedded ? 20 : 0, borderRadius: isEmbedded ? 8 : 0 }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: toast.type === 'success' ? '#4caf50' : '#f44336',
          color: 'white', padding: '12px 20px', borderRadius: 6, fontSize: 12, zIndex: 1000,
        }}>
          {toast.message}
        </div>
      )}

      {/* Header with Buttons (only show when embedded) */}
      {isEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: G.lime }}>My Profile</h2>
          {canEdit && !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: G.lime, color: G.dark, border: 'none', borderRadius: 6,
                padding: '9px 16px', fontWeight: 800, fontSize: 12, cursor: 'pointer',
              }}
            >
              ✏️ Edit Profile
            </button>
          ) : canEdit && isEditing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: G.lime, color: G.dark, border: 'none', borderRadius: 6,
                  padding: '9px 16px', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? '⏳ Saving...' : '💾 Save'}
              </button>
              <button
                onClick={handleCancel}
                style={{
                  background: 'transparent', color: G.muted, border: `1px solid ${G.cardBorder}`, borderRadius: 6,
                  padding: '9px 16px', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Profile Card */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {isEditing ? (
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: 90, height: 90, borderRadius: '50%', objectFit: 'cover',
                    border: `2px solid ${G.lime}`, cursor: 'pointer',
                  }}
                />
              ) : (
                <div style={{
                  width: 90, height: 90, borderRadius: '50%', background: `linear-gradient(135deg, ${G.bright}, ${G.mid})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
                  border: `2px solid ${G.lime}`, cursor: 'pointer',
                }}>
                  {formData.firstName?.[0]}
                </div>
              )}
            </label>
          ) : (
            <>
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${G.lime}` }}
                />
              ) : (
                <div style={{
                  width: 90, height: 90, borderRadius: '50%', background: `linear-gradient(135deg, ${G.bright}, ${G.mid})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
                  border: `2px solid ${G.lime}`,
                }}>
                  {formData.firstName?.[0]}
                </div>
              )}
            </>
          )}
        </div>

        {/* Profile Info */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
            {formData.firstName} {formData.lastName}
          </h1>
          <p style={{ color: G.muted, fontSize: 12, marginBottom: 10 }}>{formData.email}</p>
          {profileData?.createdAt && (
            <p style={{ color: G.muted, fontSize: 11 }}>
              Member since {new Date(profileData.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Profile Form */}
      {canEdit && isEditing ? (
        /* EDIT MODE */
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* First Name */}
          <div>
            <label style={{ fontSize: 11, color: G.muted, display: 'block', marginBottom: 6, fontWeight: 700 }}>First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              style={{
                width: '100%', padding: '8px 10px', background: G.mid, border: `1px solid ${G.cardBorder}`,
                color: G.text, borderRadius: 6, fontSize: 12, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Last Name */}
          <div>
            <label style={{ fontSize: 11, color: G.muted, display: 'block', marginBottom: 6, fontWeight: 700 }}>Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              style={{
                width: '100%', padding: '8px 10px', background: G.mid, border: `1px solid ${G.cardBorder}`,
                color: G.text, borderRadius: 6, fontSize: 12, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: 11, color: G.muted, display: 'block', marginBottom: 6, fontWeight: 700 }}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={{
                width: '100%', padding: '8px 10px', background: G.mid, border: `1px solid ${G.cardBorder}`,
                color: G.text, borderRadius: 6, fontSize: 12, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ fontSize: 11, color: G.muted, display: 'block', marginBottom: 6, fontWeight: 700 }}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              style={{
                width: '100%', padding: '8px 10px', background: G.mid, border: `1px solid ${G.cardBorder}`,
                color: G.text, borderRadius: 6, fontSize: 12, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Gender */}
          <div>
            <label style={{ fontSize: 11, color: G.muted, display: 'block', marginBottom: 6, fontWeight: 700 }}>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              style={{
                width: '100%', padding: '8px 10px', background: G.mid, border: `1px solid ${G.cardBorder}`,
                color: G.text, borderRadius: 6, fontSize: 12, outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label style={{ fontSize: 11, color: G.muted, display: 'block', marginBottom: 6, fontWeight: 700 }}>Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              style={{
                width: '100%', padding: '8px 10px', background: G.mid, border: `1px solid ${G.cardBorder}`,
                color: G.text, borderRadius: 6, fontSize: 12, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Nationality */}
          <div>
            <label style={{ fontSize: 11, color: G.muted, display: 'block', marginBottom: 6, fontWeight: 700 }}>Nationality</label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleInputChange}
              style={{
                width: '100%', padding: '8px 10px', background: G.mid, border: `1px solid ${G.cardBorder}`,
                color: G.text, borderRadius: 6, fontSize: 12, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Bio */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: G.muted, display: 'block', marginBottom: 6, fontWeight: 700 }}>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              style={{
                width: '100%', padding: '8px 10px', background: G.mid, border: `1px solid ${G.cardBorder}`,
                color: G.text, borderRadius: 6, fontSize: 12, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      ) : (
        /* VIEW MODE */
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* First Name */}
          <div>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginBottom: 4 }}>First Name</div>
            <div style={{ fontSize: 12, color: G.text }}>{formData.firstName}</div>
          </div>

          {/* Last Name */}
          <div>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginBottom: 4 }}>Last Name</div>
            <div style={{ fontSize: 12, color: G.text }}>{formData.lastName}</div>
          </div>

          {/* Email */}
          <div>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginBottom: 4 }}>Email</div>
            <div style={{ fontSize: 12, color: G.text }}>{formData.email}</div>
          </div>

          {/* Phone */}
          <div>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginBottom: 4 }}>Phone</div>
            <div style={{ fontSize: 12, color: G.text }}>{formData.phone || '-'}</div>
          </div>

          {/* Gender */}
          <div>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginBottom: 4 }}>Gender</div>
            <div style={{ fontSize: 12, color: G.text }}>{formData.gender || '-'}</div>
          </div>

          {/* Date of Birth */}
          <div>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginBottom: 4 }}>Date of Birth</div>
            <div style={{ fontSize: 12, color: G.text }}>{formData.dateOfBirth || '-'}</div>
          </div>

          {/* Nationality */}
          <div>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginBottom: 4 }}>Nationality</div>
            <div style={{ fontSize: 12, color: G.text }}>{formData.nationality || '-'}</div>
          </div>

          {/* Bio */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginBottom: 4 }}>Bio</div>
            <div style={{ fontSize: 12, color: G.text, whiteSpace: 'pre-wrap' }}>{formData.bio || '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
