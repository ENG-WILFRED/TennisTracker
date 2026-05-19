'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { completeGoogleProfile } from '@/actions/google-auth';

const G = {
  dark: "#0a180a",
  card: "#1a3020",
  card2: "#1b2f1b",
  cardBorder: "#2d5a35",
  border: "#243e24",
  lime: "#7dc142",
  accent: "#a8d84e",
  text: "#e8f5e0",
  muted: "#7aaa6a",
  muted2: "#5e8e50",
};

export default function CompleteGoogleProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { login } = useAuth();
  const { setUserMemberships, setCurrentRole } = useRole();

  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  const username = searchParams.get('username');
  const photo = searchParams.get('photo');
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');
  const initialFirstName = searchParams.get('firstName');
  const initialLastName = searchParams.get('lastName');

  useEffect(() => {
    // Verify we have the required params
    if (!userId || !email || !accessToken || !refreshToken) {
      addToast('Invalid session. Please try logging in again.', 'error');
      router.push('/login');
      return;
    }

    // Set initial values from Google
    if (initialFirstName) setFirstName(initialFirstName);
    if (initialLastName) setLastName(initialLastName);
  }, [userId, email, accessToken, refreshToken, initialFirstName, initialLastName, router, addToast]);

  const handleSkip = async () => {
    setLoading(true);

    try {
      if (!userId || !email || !username || !accessToken || !refreshToken) {
        throw new Error('Invalid session. Please try logging in again.');
      }

      login(
        { accessToken: accessToken!, refreshToken: refreshToken! },
        {
          id: userId,
          username: username,
          email: email,
          firstName: firstName || initialFirstName || '',
          lastName: lastName || initialLastName || '',
          photo: photo || null,
          profileComplete: false,
        }
      );

      // Set role to spectator locally so UI doesn't assume player
      setUserMemberships([{ role: 'spectator', orgId: '', orgName: 'Platform' }]);
      setCurrentRole('spectator', null, 'Platform');

      addToast('Profile setup skipped. You can complete it later in settings.', 'info');
      router.push(`/dashboard/spectator/${userId}`);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to skip profile completion';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!firstName || !lastName) {
        throw new Error('First name and last name are required');
      }

      // Complete profile
      const user = await completeGoogleProfile({
        userId: userId!,
        firstName,
        lastName,
        gender,
        dateOfBirth,
        nationality,
        phone,
        bio,
      });

      // Login the user with the tokens
      login(
        { accessToken: accessToken!, refreshToken: refreshToken! },
        {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo,
          profileComplete: true,
        }
      );

      // Ensure spectator role for new accounts created as spectators
      setUserMemberships([{ role: 'spectator', orgId: '', orgName: 'Platform' }]);
      setCurrentRole('spectator', null, 'Platform');

      addToast('Profile completed successfully!', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push(`/dashboard/spectator/${user.id}`);
      }, 500);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to complete profile';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${G.dark} 0%, ${G.card} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 500,
        background: G.card,
        border: `1px solid ${G.cardBorder}`,
        borderRadius: 16,
        padding: '2.5rem',
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: G.text,
          marginBottom: '0.5rem',
          letterSpacing: -0.5,
        }}>
          Complete Your Profile
        </h1>
        <p style={{
          fontSize: 14,
          color: G.muted,
          marginBottom: '2rem',
        }}>
          Tell us more about yourself to get started on VICO
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: 12, color: G.muted, fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: G.card2,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: G.text,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = G.lime}
                onBlur={(e) => e.currentTarget.style.borderColor = G.border}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: G.muted, fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: G.card2,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: G.text,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = G.lime}
                onBlur={(e) => e.currentTarget.style.borderColor = G.border}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: 12, color: G.muted, fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: '100%',
                  background: G.card2,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: G.text,
                  fontSize: 14,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: G.muted, fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={{
                  width: '100%',
                  background: G.card2,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: G.text,
                  fontSize: 14,
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = G.lime}
                onBlur={(e) => e.currentTarget.style.borderColor = G.border}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: 12, color: G.muted, fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Nationality
              </label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="e.g., Kenyan"
                style={{
                  width: '100%',
                  background: G.card2,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: G.text,
                  fontSize: 14,
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = G.lime}
                onBlur={(e) => e.currentTarget.style.borderColor = G.border}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: G.muted, fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                style={{
                  width: '100%',
                  background: G.card2,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: G.text,
                  fontSize: 14,
                  outline: 'none',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = G.lime}
                onBlur={(e) => e.currentTarget.style.borderColor = G.border}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: G.muted, fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself (optional)"
              rows={3}
              style={{
                width: '100%',
                background: G.card2,
                border: `1px solid ${G.border}`,
                borderRadius: 8,
                padding: '10px 12px',
                color: G.text,
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = G.lime}
              onBlur={(e) => e.currentTarget.style.borderColor = G.border}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !firstName || !lastName}
            style={{
              width: '100%',
              padding: '12px',
              background: loading || !firstName || !lastName ? G.muted : G.lime,
              border: 'none',
              borderRadius: 8,
              color: G.dark,
              fontWeight: 700,
              fontSize: 15,
              cursor: loading || !firstName || !lastName ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading || !firstName || !lastName ? 0.7 : 1,
              letterSpacing: 0.5,
            }}
          >
            {loading ? 'Completing Profile...' : 'Complete Profile & Sign In'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '0.75rem',
              background: 'transparent',
              border: `1px solid ${G.lime}`,
              borderRadius: 8,
              color: G.lime,
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Skip for now
          </button>
        </form>

        <p style={{
          fontSize: 12,
          color: G.muted2,
          textAlign: 'center',
          marginTop: '1.5rem',
        }}>
          You can update these details anytime in your settings
        </p>
      </div>
    </div>
  );
}
