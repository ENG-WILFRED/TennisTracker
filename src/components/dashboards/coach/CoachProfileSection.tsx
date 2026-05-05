'use client';

import React from 'react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const G = {
  dark:    '#07120a',
  card:    '#0f1f10',
  card2:   '#152918',
  card3:   '#1a3020',
  border:  '#1e3822',
  borderHi:'#2e5534',
  lime:    '#79bf3e',
  lime2:   '#a8d84e',
  limeGlow:'rgba(121,191,62,0.12)',
  text:    '#e4f2da',
  text2:   '#b8d4a4',
  muted:   '#537a46',
  muted2:  '#6e9e5e',
  red:     '#d94f4f',
  redSoft: 'rgba(217,79,79,0.12)',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PersonalFormState {
  firstName: string; lastName: string; email: string; phone: string;
  gender: string; dateOfBirth: string; nationality: string; bio: string; photo: string;
}
export interface CertificateFormState {
  name: string; issuer: string; issuedAt: string; expiresAt: string;
}
export interface AvailabilityFormState {
  day: string; startTime: string; endTime: string;
}
export type ProfileTab = 'personal' | 'bio' | 'certifications' | 'availability';
export interface CoachProfileSectionProps {
  user?: any;
  profileData: PersonalFormState | null;
  personalForm: PersonalFormState;
  setPersonalForm: React.Dispatch<React.SetStateAction<PersonalFormState>>;
  savingProfile: boolean;
  handleSaveProfile: () => Promise<void>;
  editingProfile: boolean; setEditingProfile: (v: boolean) => void;
  bioForm: string;
  setBioForm: React.Dispatch<React.SetStateAction<string>>;
  handleSaveBio: () => Promise<void>;
  savingBio: boolean;
  editingBio: boolean; setEditingBio: (v: boolean) => void;
  coachData: any;
  certForm: CertificateFormState;
  setCertForm: React.Dispatch<React.SetStateAction<CertificateFormState>>;
  handleAddCertificate: () => Promise<void>;
  savingCertificate: boolean;
  deletingCertificateIds: string[];
  handleDeleteCertificate: (certId: string, index: number) => Promise<void>;
  editingCertificates: boolean; setEditingCertificates: (v: boolean) => void;
  availForm: AvailabilityFormState;
  setAvailForm: React.Dispatch<React.SetStateAction<AvailabilityFormState>>;
  handleAddAvailability: () => Promise<void>;
  savingAvailability: boolean;
  deletingAvailabilityIds: string[];
  handleDeleteAvailability: (availId: string, index: number) => Promise<void>;
  editingAvailability: boolean; setEditingAvailability: (v: boolean) => void;
  availability: any[];
  loading: boolean;
}

// ─── Shared style constants ───────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 11px',
  background: G.dark, border: `1px solid ${G.border}`,
  color: G.text, borderRadius: 8, fontSize: 12.5,
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
};
const labelBase: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  color: G.muted2, marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.07em',
};

// ─── Primitives ───────────────────────────────────────────────────────────────
const BtnPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { small?: boolean }> = ({
  style, small, children, ...rest
}) => (
  <button {...rest} style={{
    background: G.lime, color: G.dark, border: 'none', borderRadius: 7,
    padding: small ? '6px 14px' : '9px 18px',
    fontWeight: 800, fontSize: small ? 11 : 12,
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    opacity: rest.disabled ? 0.65 : 1,
    transition: 'filter .15s', whiteSpace: 'nowrap', ...style,
  }}>{children}</button>
);

const BtnGhost: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ style, children, ...rest }) => (
  <button {...rest} style={{
    background: 'transparent', color: G.text2,
    border: `1px solid ${G.border}`, borderRadius: 7,
    padding: '5px 13px', fontWeight: 600, fontSize: 11,
    cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap', ...style,
  }}>{children}</button>
);

const BtnDanger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ style, children, ...rest }) => (
  <button {...rest} style={{
    background: G.redSoft, color: G.red,
    border: `1px solid rgba(217,79,79,0.25)`, borderRadius: 6,
    padding: '4px 10px', fontSize: 11, fontWeight: 600,
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    opacity: rest.disabled ? 0.5 : 1, transition: 'all .15s', ...style,
  }}>{children}</button>
);

const Field: React.FC<{ label: string; children: React.ReactNode; span2?: boolean }> = ({ label, children, span2 }) => (
  <div style={{ gridColumn: span2 ? '1 / -1' : undefined }}>
    <label style={labelBase}>{label}</label>
    {children}
  </div>
);

const InfoTile: React.FC<{ label: string; value?: string | null; accent?: boolean; span2?: boolean }> = ({
  label, value, accent, span2,
}) => (
  <div style={{
    background: G.dark, borderRadius: 9, padding: '10px 13px',
    border: `1px solid ${G.border}`, gridColumn: span2 ? '1 / -1' : undefined,
  }}>
    <div style={{ fontSize: 9.5, color: G.muted, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
    <div style={{ fontSize: 12.5, color: accent ? G.lime2 : G.text, lineHeight: 1.55, fontWeight: accent ? 700 : 400 }}>{value || '—'}</div>
  </div>
);

const Empty: React.FC<{ message: string }> = ({ message }) => (
  <div style={{
    textAlign: 'center', padding: '28px 16px', color: G.muted, fontSize: 12.5,
    border: `1px dashed ${G.border}`, borderRadius: 10,
  }}>{message}</div>
);

// ─── Section card ─────────────────────────────────────────────────────────────
const Section: React.FC<{
  icon: string; title: string; subtitle?: string;
  action?: React.ReactNode; children: React.ReactNode;
}> = ({ icon, title, subtitle, action, children }) => (
  <div style={{
    background: G.card, border: `1px solid ${G.border}`,
    borderRadius: 14, overflow: 'hidden',
    boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px', borderBottom: `1px solid ${G.border}`,
      background: G.card2, gap: 10, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{
          fontSize: 16, background: G.limeGlow,
          border: `1px solid ${G.borderHi}`, borderRadius: 8,
          width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: G.text, letterSpacing: '-0.01em' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 10.5, color: G.muted, marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
    <div style={{ padding: '16px 18px' }}>{children}</div>
  </div>
);

// ─── Responsive grids ─────────────────────────────────────────────────────────
const Grid2: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap }}>{children}</div>
);
const Grid3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>{children}</div>
);

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ════════════════════════════════════════════════════════════════════════════════
export function CoachProfileSection({
  user, profileData, personalForm, setPersonalForm, savingProfile, handleSaveProfile,
  editingProfile, setEditingProfile,
  bioForm, setBioForm, handleSaveBio, savingBio, editingBio, setEditingBio,
  coachData, certForm, setCertForm, handleAddCertificate, savingCertificate,
  deletingCertificateIds, handleDeleteCertificate, editingCertificates, setEditingCertificates,
  availForm, setAvailForm, handleAddAvailability, savingAvailability,
  deletingAvailabilityIds, handleDeleteAvailability, editingAvailability, setEditingAvailability,
  loading,
}: CoachProfileSectionProps) {

  const personalFields: Array<{ label: string; key: keyof PersonalFormState; type?: string }> = [
    { label: 'First Name',    key: 'firstName'   },
    { label: 'Last Name',     key: 'lastName'    },
    { label: 'Email',         key: 'email'       },
    { label: 'Phone',         key: 'phone'       },
    { label: 'Gender',        key: 'gender'      },
    { label: 'Date of Birth', key: 'dateOfBirth', type: 'date' },
    { label: 'Nationality',   key: 'nationality' },
    { label: 'Photo URL',     key: 'photo'       },
  ];

  const certifications: any[] = coachData?.certifications || [];
  const slots: any[] = coachData?.availability || [];

  // Group availability by day
  const groupedSlots: Record<string, any[]> = {};
  slots.forEach(s => {
    const day = DAY_NAMES[s.dayOfWeek] ?? 'Unknown';
    if (!groupedSlots[day]) groupedSlots[day] = [];
    groupedSlots[day].push(s);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ─── PERSONAL INFO ─────────────────────────────────────────────────── */}
      <Section
        icon="👤"
        title="Personal Information"
        subtitle="Identity & contact details"
        action={
          editingProfile ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <BtnGhost onClick={() => setEditingProfile(false)}>✕ Cancel</BtnGhost>
              <BtnPrimary small onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving…' : '✓ Save'}
              </BtnPrimary>
            </div>
          ) : (
            <BtnGhost onClick={() => setEditingProfile(true)}>✎ Edit</BtnGhost>
          )
        }
      >
        {editingProfile ? (
          <Grid2>
            {personalFields.map(({ label, key, type }) => (
              <Field key={key} label={label}>
                <input
                  type={type || 'text'}
                  style={inputBase}
                  value={personalForm[key] as string}
                  onChange={e => setPersonalForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </Field>
            ))}
          </Grid2>
        ) : (
          <Grid2>
            <InfoTile label="First Name"    value={profileData?.firstName   || user?.firstName} />
            <InfoTile label="Last Name"     value={profileData?.lastName    || user?.lastName} />
            <InfoTile label="Email"         value={profileData?.email       || user?.email} />
            <InfoTile label="Phone"         value={profileData?.phone} />
            <InfoTile label="Gender"        value={profileData?.gender} />
            <InfoTile label="Date of Birth" value={profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : undefined} />
            <InfoTile label="Nationality"   value={profileData?.nationality} />
          </Grid2>
        )}
      </Section>

      {/* ─── BIOGRAPHY ─────────────────────────────────────────────────────── */}
      <Section
        icon="📝"
        title="Biography"
        subtitle="Your coaching story & background"
        action={
          editingBio ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <BtnGhost onClick={() => setEditingBio(false)}>✕ Cancel</BtnGhost>
              <BtnPrimary small onClick={handleSaveBio} disabled={savingBio}>
                {savingBio ? 'Saving…' : '💾 Save'}
              </BtnPrimary>
            </div>
          ) : (
            <BtnGhost onClick={() => { setBioForm(coachData?.bio || ''); setEditingBio(true); }}>✎ Edit</BtnGhost>
          )
        }
      >
        {editingBio ? (
          <textarea
            rows={5}
            placeholder="Write your coaching story…"
            style={{ ...inputBase, resize: 'vertical', minHeight: 110, lineHeight: 1.6 }}
            value={bioForm}
            onChange={e => setBioForm(e.target.value)}
          />
        ) : coachData?.bio ? (
          <p style={{ fontSize: 13, lineHeight: 1.75, color: G.text2, margin: 0 }}>
            {coachData.bio}
          </p>
        ) : (
          <Empty message="No biography added yet. Tell athletes about your coaching philosophy." />
        )}
      </Section>

      {/* ─── CERTIFICATIONS ────────────────────────────────────────────────── */}
      <Section
        icon="🏅"
        title="Certifications & Credentials"
        subtitle={`${certifications.length} credential${certifications.length !== 1 ? 's' : ''}`}
        action={
          <BtnGhost onClick={() => setEditingCertificates(!editingCertificates)}>
            {editingCertificates ? '✕ Done' : '➕ Add'}
          </BtnGhost>
        }
      >
        {editingCertificates && (
          <div style={{
            background: G.card3, border: `1px solid ${G.borderHi}`,
            borderRadius: 10, padding: 14, marginBottom: 14,
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: G.lime2, marginBottom: 12, letterSpacing: '0.06em' }}>
              NEW CERTIFICATE
            </div>
            <Grid2 gap={10}>
              <Field label="Certificate Name">
                <input style={inputBase} placeholder="e.g., ITF Level 2"
                  value={certForm.name}
                  onChange={e => setCertForm(p => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field label="Issuer">
                <input style={inputBase} placeholder="e.g., ITF"
                  value={certForm.issuer}
                  onChange={e => setCertForm(p => ({ ...p, issuer: e.target.value }))} />
              </Field>
              <Field label="Issued Date">
                <input type="date" style={inputBase} value={certForm.issuedAt}
                  onChange={e => setCertForm(p => ({ ...p, issuedAt: e.target.value }))} />
              </Field>
              <Field label="Expiry Date (Optional)">
                <input type="date" style={inputBase} value={certForm.expiresAt}
                  onChange={e => setCertForm(p => ({ ...p, expiresAt: e.target.value }))} />
              </Field>
            </Grid2>
            <div style={{ marginTop: 12 }}>
              <BtnPrimary small onClick={handleAddCertificate} disabled={savingCertificate}>
                {savingCertificate ? 'Adding…' : '+ Add Certificate'}
              </BtnPrimary>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ fontSize: 12.5, color: G.muted }}>Loading…</p>
        ) : certifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {certifications.map((cert, i) => (
              <div key={cert.id || i} style={{
                background: G.dark, borderRadius: 9, padding: '12px 14px',
                border: `1px solid ${G.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: G.text, marginBottom: 3 }}>{cert.name}</div>
                  <div style={{ fontSize: 11, color: G.muted, display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
                    {cert.issuer && <span style={{ color: G.muted2, fontWeight: 600 }}>{cert.issuer}</span>}
                    <span>Issued {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'N/A'}</span>
                    {cert.expiresAt && <span>Expires {new Date(cert.expiresAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <BtnDanger
                  onClick={() => handleDeleteCertificate(cert.id, i)}
                  disabled={deletingCertificateIds.includes(cert.id)}
                >
                  {deletingCertificateIds.includes(cert.id) ? '…' : '✕ Remove'}
                </BtnDanger>
              </div>
            ))}
          </div>
        ) : (
          <Empty message="No certifications yet. Add your credentials to build trust with athletes." />
        )}
      </Section>

      {/* ─── AVAILABILITY ──────────────────────────────────────────────────── */}
      <Section
        icon="📅"
        title="Coaching Availability"
        subtitle={`${slots.length} time slot${slots.length !== 1 ? 's' : ''} scheduled`}
        action={
          <BtnGhost onClick={() => setEditingAvailability(!editingAvailability)}>
            {editingAvailability ? '✕ Done' : '➕ Add'}
          </BtnGhost>
        }
      >
        {editingAvailability && (
          <div style={{
            background: G.card3, border: `1px solid ${G.borderHi}`,
            borderRadius: 10, padding: 14, marginBottom: 14,
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: G.lime2, marginBottom: 12, letterSpacing: '0.06em' }}>
              NEW TIME SLOT
            </div>
            <Grid3>
              <Field label="Day">
                <select style={{ ...inputBase }}
                  value={availForm.day}
                  onChange={e => setAvailForm(p => ({ ...p, day: e.target.value }))}>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Start Time">
                <input type="time" style={inputBase} value={availForm.startTime}
                  onChange={e => setAvailForm(p => ({ ...p, startTime: e.target.value }))} />
              </Field>
              <Field label="End Time">
                <input type="time" style={inputBase} value={availForm.endTime}
                  onChange={e => setAvailForm(p => ({ ...p, endTime: e.target.value }))} />
              </Field>
            </Grid3>
            <div style={{ marginTop: 12 }}>
              <BtnPrimary small onClick={handleAddAvailability} disabled={savingAvailability}>
                {savingAvailability ? 'Adding…' : '+ Add Time Slot'}
              </BtnPrimary>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ fontSize: 12.5, color: G.muted }}>Loading…</p>
        ) : slots.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {Object.entries(groupedSlots).map(([day, daySlots]) => (
              <div key={day} style={{
                background: G.dark, borderRadius: 10,
                border: `1px solid ${G.border}`, padding: '12px 14px',
              }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 800, color: G.lime2,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                }}>{day}</div>
                {daySlots.map((avail, i) => (
                  <div key={avail.id || i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: i < daySlots.length - 1 ? 6 : 0, gap: 6,
                  }}>
                    <div style={{
                      fontSize: 12, color: G.text, fontWeight: 600,
                      background: G.card3, borderRadius: 6,
                      padding: '4px 8px', flex: 1, textAlign: 'center',
                    }}>
                      {avail.startTime} – {avail.endTime}
                    </div>
                    <button
                      onClick={() => handleDeleteAvailability(avail.id, i)}
                      disabled={deletingAvailabilityIds.includes(avail.id)}
                      style={{
                        background: 'none', border: 'none', color: G.red,
                        cursor: deletingAvailabilityIds.includes(avail.id) ? 'not-allowed' : 'pointer',
                        fontSize: 13, opacity: deletingAvailabilityIds.includes(avail.id) ? 0.4 : 0.65,
                        padding: '2px 4px', lineHeight: 1, flexShrink: 0,
                      }}
                      title="Remove slot"
                    >✕</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <Empty message="No schedule set. Add time slots so athletes can book sessions." />
        )}
      </Section>

    </div>
  );
}