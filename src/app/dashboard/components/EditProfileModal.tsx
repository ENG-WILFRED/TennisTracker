import React from 'react';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

export default function EditProfileModal({
  show,
  editForm,
  onChange,
  onClose,
  onSubmit,
  saving,
}: any) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
      <div style={{ background: G.sidebar, borderRadius: 12, padding: 24, width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: `1px solid ${G.cardBorder}`, position: 'relative' }}>
        <button 
          onClick={onClose} 
          aria-label="Close" 
          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: G.muted, fontSize: 28, cursor: 'pointer', padding: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ×
        </button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: G.lime, marginBottom: 20 }}>✏️ Edit Profile</h2>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              name="firstName" 
              value={editForm.firstName} 
              onChange={onChange} 
              required 
              placeholder="First Name" 
              style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}
            />
            <input 
              name="lastName" 
              value={editForm.lastName} 
              onChange={onChange} 
              required 
              placeholder="Last Name" 
              style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              name="email" 
              type="email" 
              value={editForm.email} 
              onChange={onChange} 
              required 
              placeholder="Email" 
              style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}
            />
            <input 
              name="phone" 
              value={editForm.phone} 
              onChange={onChange} 
              placeholder="Phone" 
              style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <select 
              name="gender" 
              value={editForm.gender} 
              onChange={onChange} 
              style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}
            >
              <option value="" style={{ color: '#000' }}>Select Gender</option>
              <option value="Male" style={{ color: '#000' }}>Male</option>
              <option value="Female" style={{ color: '#000' }}>Female</option>
              <option value="Other" style={{ color: '#000' }}>Other</option>
            </select>
            <input 
              name="dateOfBirth" 
              type="date" 
              value={editForm.dateOfBirth} 
              onChange={onChange} 
              style={{ flex: 1, background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}
            />
          </div>
          <input 
            name="nationality" 
            value={editForm.nationality} 
            onChange={onChange} 
            placeholder="Nationality" 
            style={{ width: '100%', background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}
          />
          <textarea 
            name="bio" 
            value={editForm.bio} 
            onChange={onChange} 
            rows={3} 
            placeholder="Bio (Tell us about yourself)" 
            style={{ width: '100%', background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <input 
            name="photo" 
            value={editForm.photo} 
            onChange={onChange} 
            placeholder="Photo URL" 
            style={{ width: '100%', background: G.dark, border: `1px solid ${G.cardBorder}`, color: G.text, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}
          />
          <button 
            type="submit" 
            disabled={saving} 
            style={{ width: '100%', background: G.lime, color: G.dark, border: 'none', borderRadius: 8, padding: '12px 16px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, marginTop: 6 }}
          >
            {saving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
