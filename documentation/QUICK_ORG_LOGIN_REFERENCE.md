# 🎯 Quick Login Reference Card

**Copy & Paste Login Credentials**

## Organization 1: Central Tennis Club
```
Admin Email:    admin@centraltennis.com
Admin Password: tennis123

Finance Email:    finance@centraltennis.com
Finance Password: tennis123
```

## Organization 2: Elite Sports Academy
```
Admin Email:    admin@elitesports.com
Admin Password: tennis123

Finance Email:    finance@elitesports.com
Finance Password: tennis123
```

## Organization 3: Community Tennis Courts
```
Admin Email:    admin@communitytennis.org
Admin Password: tennis123

Finance Email:    finance@communitytennis.org
Finance Password: tennis123
```

---

## Quick Test Scenarios

### Scenario A: Login as Admin
1. Visit `/login`
2. Paste: `admin@centraltennis.com`
3. Paste: `tennis123`
4. Click Login
5. You should see organization dashboard

### Scenario B: Login as Finance Officer
1. Visit `/login`
2. Paste: `finance@centraltennis.com`
3. Paste: `tennis123`
4. Click Login
5. You should see financial dashboard

### Scenario C: Test Multi-Organization
1. Logout current admin
2. Login as: `admin@elitesports.com`
3. Password: `tennis123`
4. Verify different organization dashboard loads

---

## Important Notes

⚠️ **These are TEST credentials only**
- Valid only in development environment
- Change all credentials before production
- Do not commit real passwords to repository
- Use environment variables for sensitive data

🔄 **If Accounts Get Lost**
```bash
npm run prisma:reset
```
This will recreate all seeded data including admin accounts.

---

## Common APIs to Test

### Login Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "admin@centraltennis.com",
    "password": "tennis123"
  }'
```

### Get Organization (with token)
```bash
curl -X GET http://localhost:3000/api/organization/{orgId} \
  -H "Authorization: Bearer {accessToken}"
```

---

## Dashboard URLs After Login

- **Admin Dashboard:** `/dashboard/organization`
- **Finance Dashboard:** `/dashboard/finance`  
- **Settings:** `/settings`
- **Profile:** `/profile`

---

**🚀 Ready to test! Just run `npm run dev` and login above.**
