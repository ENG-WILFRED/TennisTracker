# Google OAuth Implementation - Verification Checklist

## ✅ Implementation Complete

This checklist helps verify the Google OAuth implementation is working correctly.

## Pre-Deployment Checks

### Configuration
- [ ] Google OAuth credentials obtained from Google Console
- [ ] GOOGLE_CLIENT_ID added to .env
- [ ] GOOGLE_CLIENT_SECRET added to .env
- [ ] NEXT_PUBLIC_GOOGLE_CLIENT_ID added to .env
- [ ] NEXTAUTH_URL configured (http://localhost:3000 for dev)
- [ ] NEXTAUTH_SECRET generated and added
- [ ] NEXT_PUBLIC_APP_URL configured

### Code Review
- [ ] src/app/api/auth/[...nextauth]/auth.config.ts contains GoogleProvider
- [ ] src/app/login/page.tsx Google button calls handleGoogleClicked
- [ ] src/app/register/page.tsx has "Sign up with Google" button
- [ ] src/actions/google-auth.ts exports handleGoogleAuth and completeGoogleProfile
- [ ] src/app/api/auth/google/callback/route.ts handles OAuth callback
- [ ] No TypeScript errors in implementation files

### Database
- [ ] User table has all required fields (email, firstName, lastName, passwordHash)
- [ ] Spectator table exists with userId foreign key
- [ ] No migration errors when running the app

## Functionality Tests

### Test 1: New User Registration via Google
- [ ] Go to http://localhost:3000/login
- [ ] Click "Google" button
- [ ] Sign in with a Google account NOT in the system
- [ ] Redirected to profile completion page
- [ ] Profile form displays with empty fields
- [ ] Can fill in all fields (firstName, lastName, gender, dateOfBirth, etc.)
- [ ] Submit button works and creates user
- [ ] Redirected to dashboard
- [ ] User created in database as spectator
- [ ] Can see user profile in dashboard

### Test 2: Existing User Login via Google
- [ ] Create a user via email/password registration first
- [ ] Go to http://localhost:3000/login
- [ ] Click "Google" button
- [ ] Sign in with Google using the same email
- [ ] Directly logs in (no profile form)
- [ ] Redirected to dashboard
- [ ] User data is correct

### Test 3: Google Sign Up from Register Page
- [ ] Go to http://localhost:3000/register
- [ ] Click "Sign up with Google" button
- [ ] Same flow as Test 1
- [ ] User created successfully

### Test 4: Edge Cases
- [ ] Multiple Google logins with same account (should redirect to dashboard)
- [ ] Signing in after terms acceptance requirement
- [ ] Different Google account emails (should create separate users)
- [ ] Google profile picture displays correctly

## Database Verification

```sql
-- Check if user was created
SELECT * FROM "User" WHERE email = 'test@gmail.com';

-- Check if spectator profile exists
SELECT * FROM "Spectator" WHERE "userId" = 'user-id-here';

-- Verify user has accepted terms
SELECT "acceptedTermsAt" FROM "User" WHERE email = 'test@gmail.com';
```

## Performance Tests

- [ ] Login response time < 2 seconds
- [ ] Profile completion form responsive
- [ ] No database N+1 queries
- [ ] Token generation fast
- [ ] Redirect smooth

## Browser Compatibility

- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Mobile browsers work (responsive design)

## Security Tests

- [ ] No credentials in browser console
- [ ] Access tokens not visible in localStorage
- [ ] HttpOnly cookies set correctly
- [ ] CSRF protection active
- [ ] No sensitive data in URLs
- [ ] Redirect URLs validated

## Production Deployment

### Pre-Production
- [ ] All dev tests passing
- [ ] Database backed up
- [ ] HTTPS enabled on domain
- [ ] NEXTAUTH_URL updated to production domain
- [ ] New NEXTAUTH_SECRET generated
- [ ] Production Google OAuth credentials obtained
- [ ] Production redirect URI added to Google Console

### Post-Production
- [ ] Test full login flow in production
- [ ] Monitor error logs
- [ ] Verify email verification works
- [ ] Test password reset flow (if applicable)
- [ ] Monitor authentication metrics

## Documentation

- [ ] GOOGLE_OAUTH_QUICKSTART.md reviewed
- [ ] documentation/auth-organization/GOOGLE_OAUTH_SETUP.md reviewed
- [ ] .env.example updated and correct
- [ ] Code comments clear and helpful
- [ ] No TODOs or FIXMEs remaining

## Rollback Plan

If issues occur, have this ready:
- [ ] Backup of .env before changes
- [ ] Previous version of files backed up
- [ ] Git commits are clean and can be reverted
- [ ] Database migration reversible (none made, so no issue)

## Monitoring

Set up monitoring for:
- [ ] Failed authentication attempts
- [ ] OAuth redirect errors
- [ ] User creation errors
- [ ] Token generation failures
- [ ] Database connection issues

## Sign-Off

- [ ] Developer verified implementation
- [ ] QA tested all scenarios
- [ ] Documentation complete
- [ ] Ready for production

---

## Quick Debug Commands

If issues occur, run:

```bash
# Check if env vars are loaded
echo $GOOGLE_CLIENT_ID

# Restart dev server
npm run dev

# Check database connection
npx prisma db execute --stdin < check-user.sql

# View logs
tail -f logs/*.log
```

## Common Issues & Solutions

### "Invalid Client ID"
- [ ] Copy exact ID from Google Console (no extra spaces)
- [ ] Check both GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_CLIENT_ID are set
- [ ] Restart dev server after changing .env

### "Redirect URI Mismatch"
- [ ] Must exactly match in Google Console
- [ ] Check http:// vs https://
- [ ] Check trailing slashes
- [ ] Don't include query parameters

### "User already exists"
- [ ] This is expected if user tries different Google account with same email
- [ ] User should use password login with that email

### "Profile completion page shows 404"
- [ ] Check if userId, email, accessToken params are in URL
- [ ] Verify callback route is passing params correctly

---

## Sign-Off Sheet

| Item | Status | Date | Notes |
|------|--------|------|-------|
| Implementation Complete | ✅ | | All files created/updated |
| TypeScript Check | ✅ | | No errors |
| Manual Testing | ⏳ | | Start testing |
| Documentation | ✅ | | Complete |
| Deployment Ready | ⏳ | | After testing |

---

**Implementation Version**: 1.0
**Status**: Ready for Testing
**Last Updated**: May 16, 2026
