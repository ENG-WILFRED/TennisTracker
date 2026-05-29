'use client';

import { useEffect } from 'react';

export default function GoogleSigninPage() {
  useEffect(() => {
    // Initiate Google OAuth flow
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3020'}/api/auth/google/callback`;
    
    const params = new URLSearchParams({
      client_id: clientId || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      background: '#0a180a'
    }}>
      <p style={{ color: '#e8f5e0', fontSize: 18 }}>Redirecting to Google...</p>
    </div>
  );
}
