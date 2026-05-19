# Google OAuth Implementation Guide

## Overview

The VICO Tennis Tracker now supports Google OAuth authentication. This allows users to:
- Sign in with their Google account on the login page
- Automatically register as a spectator if their email is not found
- Complete their profile with additional fields after registration
- Seamless authentication without password management

## Features

✅ **Auto-Registration**: New users signing in with Google are automatically registered as spectators
✅ **Profile Completion**: After signup, users are prompted to complete their profile
✅ **Fast & Secure**: Uses Google's OAuth 2.0 flow with industry-standard JWT tokens
✅ **Existing Users**: Users with existing accounts can still sign in with Google
✅ **Spectator Profile**: New Google users start as spectators and can upgrade their role later

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing one)
3. Enable the "Google+ API":
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Select "Web application"
   - Add Authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/google/callback`
     - Production: `https://yourdomain.com/api/auth/google/callback`
   - Copy the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000  # Change to production URL in production
NEXTAUTH_SECRET=your-secret-key-at-least-32-characters
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install Dependencies (if not already installed)

```bash
npm install next-auth
```

## Architecture

### Authentication Flow

#### New User (Google Login)
```
1. User clicks "Google" button on login/register page
2. User is redirected to Google OAuth
3. User authenticates with Google
4. Redirected to /api/auth/google/callback
5. System checks if user exists by email
6. If NOT FOUND:
   - Create user account with Google data
   - Auto-register as spectator
   - Redirect to profile completion page (/auth/complete-google-profile)
7. User completes profile (firstName, lastName, optional fields)
8. User is logged in and redirected to dashboard
```

#### Existing User (Google Login)
```
1. User clicks "Google" button
2. Google OAuth flow
3. System finds existing user by email
4. User is logged in and redirected to dashboard
```

### Files Created/Modified

#### New Files
- `src/actions/google-auth.ts` - Server actions for Google OAuth
- `src/app/api/auth/google/callback/route.ts` - OAuth callback handler
- `src/app/auth/google-signin/page.tsx` - Initiates Google OAuth flow
- `src/app/auth/complete-google-profile/page.tsx` - Profile completion page
- `.env.example` - Environment variables template

#### Modified Files
- `src/app/api/auth/[...nextauth]/auth.config.ts` - Added Google provider
- `src/app/login/page.tsx` - Updated Google button handler
- `src/app/register/page.tsx` - Added Google signup option
- `.env` - Added Google OAuth credentials

## Data Flow

### Database Changes

No database schema changes required! The system uses existing tables:
- `User` table - Stores user account information
- `Spectator` table - Links users to their spectator profile

### User Data Mapping

When a user signs in with Google, we capture:
- Email (required)
- First Name (optional)
- Last Name (optional)
- Profile Picture (optional)

Additional fields are collected on the profile completion page:
- Gender
- Date of Birth
- Nationality
- Phone
- Bio

## API Endpoints

### Google Sign-In Initiation
- **Route**: `/auth/google-signin`
- **Method**: GET
- **Purpose**: Initiates Google OAuth flow

### OAuth Callback
- **Route**: `/api/auth/google/callback`
- **Method**: GET
- **Parameters**: `code`, `state`
- **Purpose**: Handles Google OAuth callback, auto-registers user if needed

### Profile Completion
- **Route**: `/auth/complete-google-profile`
- **Method**: GET (display form) / POST (submit via action)
- **Purpose**: Allows users to complete their profile after signup

## Server Actions

### `handleGoogleAuth`
Handles the Google authentication and auto-registration.

```typescript
const result = await handleGoogleAuth({
  email: string,
  firstName?: string,
  lastName?: string,
  image?: string
});
// Returns: { isNew: boolean, user: UserData }
```

### `completeGoogleProfile`
Completes the user profile with additional fields.

```typescript
const user = await completeGoogleProfile({
  userId: string,
  firstName: string,
  lastName: string,
  gender?: string,
  dateOfBirth?: string,
  nationality?: string,
  phone?: string,
  bio?: string
});
// Returns: UserData
```

## Security Considerations

✅ **HTTPS Only**: Always use HTTPS in production
✅ **Secret Keys**: Keep `NEXTAUTH_SECRET` and `GOOGLE_CLIENT_SECRET` secure
✅ **Token Expiration**: Access tokens expire in 15 minutes, refresh tokens in 7 days
✅ **Same-Site Cookies**: Cookies use `SameSite=Lax` for CSRF protection
✅ **No Password Storage**: Google users don't have password hashes stored

## Testing

### Manual Testing Steps

1. **Local Development**:
   ```bash
   npm run dev
   ```

2. **Test New User Signup**:
   - Go to http://localhost:3000/login
   - Click "Google" button
   - Sign in with a test Google account (not registered yet)
   - Complete profile form
   - Verify user is created as spectator

3. **Test Existing User Login**:
   - Go to http://localhost:3000/login
   - Click "Google" button
   - Sign in with previously registered Google account
   - Should go directly to dashboard

4. **Test Register Page**:
   - Go to http://localhost:3000/register
   - Click "Sign up with Google"
   - Follow same flow as login

### Troubleshooting

**Issue**: "No authorization code provided"
- **Solution**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

**Issue**: Redirect URI mismatch
- **Solution**: Check that redirect URI in Google Console matches your app URL

**Issue**: User already exists error
- **Solution**: This is normal behavior - user should use password login or reset password

**Issue**: Profile completion page shows 404
- **Solution**: Ensure query parameters are passed: `userId`, `email`, `accessToken`, `refreshToken`

## Production Deployment

### 1. Update Environment Variables

```env
# Production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-strong-32-char-secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Google OAuth - Use production credentials
GOOGLE_CLIENT_ID=your-prod-client-id
GOOGLE_CLIENT_SECRET=your-prod-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-prod-client-id
```

### 2. Update Google OAuth Settings

- Go to Google Cloud Console
- Add production redirect URI: `https://yourdomain.com/api/auth/google/callback`

### 3. Verify HTTPS

Ensure your domain uses HTTPS - OAuth will not work over HTTP in production

## Performance Optimization

✅ **Fast Registration**: No email verification needed for Google users
✅ **Parallel Queries**: Database operations are optimized
✅ **Token Caching**: JWT tokens are cached in HttpOnly cookies
✅ **Lazy Loading**: Profile completion is separate from authentication

## Future Enhancements

Potential improvements:
- [ ] Support for other OAuth providers (GitHub, Apple, Microsoft)
- [ ] Email verification for email-based signup
- [ ] Two-factor authentication
- [ ] Social profile sync (refresh profile from Google)
- [ ] Account linking (link multiple auth methods to one account)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
3. Check NextAuth.js documentation: https://next-auth.js.org/

---

**Last Updated**: May 2026
**Status**: Production Ready ✅
