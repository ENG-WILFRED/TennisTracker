# Developer Guide - Pre-Push Validation System

## 🎯 Quick Start

### Before You Push Code

1. **Run Local Validation**
   ```bash
   # TypeScript check
   npx tsc --noEmit
   
   # Build locally
   npm run build
   
   # Lint check
   npm run lint
   ```

2. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "type(scope): description"
   ```

3. **Push to Remote**
   ```bash
   git push origin your-branch
   ```

4. **GitHub Actions Will**
   - ✅ Run full validation pipeline
   - ✅ Report results on your PR
   - ✅ Block merge if checks fail

---

## 📋 What Gets Validated

### 1. **Build Validation** (30 min timeout)
- ✅ TypeScript compilation check
- ✅ Next.js production build
- ✅ All 50+ database tables verified
- ✅ 167 static pages pre-rendered

**Pass Criteria**: No errors during build process

### 2. **Lint Checking** (15 min timeout)
- ✅ ESLint code quality
- ✅ Code style standards
- ✅ Import organization

**Pass Criteria**: All lint rules satisfied

### 3. **Migration Check** (15 min timeout)
- ✅ Database connection verified
- ✅ Migration status checked
- ✅ Schema pushed to database
- ✅ All 57 migrations applied

**Pass Criteria**: Database schema synchronized

### 4. **Test Execution** (20 min timeout)
- ✅ Unit tests
- ✅ Integration tests
- ✅ Database-dependent tests

**Pass Criteria**: All tests pass

### 5. **Report Generation**
- ✅ Summary report created
- ✅ PR comment posted
- ✅ Status emojis displayed

---

## 🚨 Common Issues & Solutions

### Issue: Build Fails with TypeScript Errors
**Error**: `error TS####: ...`

**Solution**:
```bash
# 1. Check error details
npx tsc --noEmit

# 2. Fix the specific file
# Look at line number provided

# 3. Regenerate Prisma types if schema changed
npx prisma generate

# 4. Try building again
npm run build
```

### Issue: Migration Fails
**Error**: `ERROR: relation "X" does not exist`

**Solution**:
```bash
# 1. Check migration status
npx prisma migrate status

# 2. Push current schema to database
npx prisma db push --accept-data-loss

# 3. Verify migrations applied
npx prisma migrate status
```

### Issue: Lint Errors Block Merge
**Error**: `ESLint error on line X`

**Solution**:
```bash
# 1. See all lint errors
npm run lint

# 2. Auto-fix fixable errors
npm run lint -- --fix

# 3. Commit fixes
git add .
git commit -m "style: fix linting issues"
```

### Issue: Tests Fail
**Error**: `Test suite failed`

**Solution**:
```bash
# 1. Run specific test
npm run test:pilot

# 2. Check database connection
echo $DATABASE_URL

# 3. Re-run with verbose output
npm run test:pilot -- --verbose
```

---

## 📝 Commit Message Examples

### Feature
```bash
git commit -m "feat(auth): add two-factor authentication

- Implement TOTP-based 2FA
- Add backup codes generation
- Create 2FA settings page
- Add email verification step

Closes #123"
```

### Bug Fix
```bash
git commit -m "fix(api): resolve race condition in booking system

Race condition in concurrent booking requests could allow 
double-booking. Added transaction-level locking.

Closes #456"
```

### Build/CI
```bash
git commit -m "ci: add pre-push validation workflow

Add GitHub Actions workflow for:
- TypeScript validation
- Build testing
- Migration checks
- Automated PR comments"
```

### Database
```bash
git commit -m "db: add user profile fields

Added fields to User model:
- dateOfBirth (DateTime)
- nationality (String)
- bio (String, long text)

Includes migration and seed updates."
```

---

## 🔍 Reading the Report

When GitHub Actions completes, you'll see a comment like:

```
# 🚀 Pre-Push Validation Report

## ✅ Validation Status
- Build: success ✅
- Lint: success ✅
- Migrations: success ✅
- Tests: success ✅

## 📊 What Was Changed
- [List of changes]

## 📋 Checklist
- [x] Build passes
- [x] No TypeScript errors
- [x] Migrations valid
- [x] Database schema synced
- [x] All tables created
```

### Status Meanings
- ✅ **success** - All checks passed
- ❌ **failure** - At least one check failed
- ⏭️ **skipped** - Check was skipped
- ⏳ **in_progress** - Currently running

---

## 🛠️ Local Development Setup

### Initial Setup
```bash
# 1. Clone repo
git clone https://github.com/tennisapp/vico.git
cd vico

# 2. Install dependencies
npm ci

# 3. Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 4. Setup database
npx prisma db push
npx prisma generate

# 5. Build and test
npm run build
npm run test:pilot
```

### Daily Development
```bash
# Start development server
npm run dev

# In another terminal - watch for changes
npm run websocket:dev

# Keep this running for real-time updates
```

### Before Pushing
```bash
# Run all local checks
npx tsc --noEmit
npm run lint -- --fix
npm run build
npm run test:pilot

# If all pass, push
git push origin your-branch
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All GitHub Actions checks pass ✅
- [ ] Code review approved 👀
- [ ] Database migrations tested ✅
- [ ] No breaking changes ⚠️
- [ ] Performance metrics acceptable 📊
- [ ] Security scan passed 🔒
- [ ] Staging environment verified 🧪

---

## 📞 Need Help?

### Read These Files
1. `COMMIT_CONVENTIONS.md` - Commit message guidelines
2. `FIX_SUMMARY.md` - What was fixed and why
3. `.github/workflows/pre-push-validation.yml` - Exact validation steps
4. `prisma/schema.prisma` - Database schema

### Commands Reference
```bash
# Check what's staged
git status

# See commit history
git log --oneline -10

# Unstage changes
git restore --staged <file>

# View file changes
git diff <file>

# See validation logs
cat .next/build-trace.json | jq .

# Test specific feature
npm run test:coach
npm run test:integration
npm run test:auth
```

---

## 🔐 Security Notes

### Sensitive Data
- Never commit `.env` files
- Use `.env.local` for local overrides
- Never hardcode API keys
- Review `.gitignore` before committing

### Database
- Never commit raw database credentials
- Use environment variables only
- Database migrations are version controlled
- Schema changes require review

### Dependencies
- Run `npm audit` regularly
- Check for security updates
- Update dependencies cautiously
- Test after major updates

---

## 🎓 Key Concepts

### GitHub Actions
- **Workflow**: A complete validation pipeline
- **Job**: A section of the workflow (build, lint, etc.)
- **Step**: A single action within a job
- **Status**: Pass/fail result of entire workflow

### Database Migrations
- **Migration**: A versioned SQL script
- **Status**: Whether migration has been applied
- **Rollback**: Reverting to previous schema version
- **Push**: Sync schema directly (risky in prod)

### TypeScript
- **noEmit**: Check without generating files
- **strict mode**: Strictest type checking
- **Compilation**: Converting TS to JS
- **Type inference**: Automatic type detection

---

## 📊 Performance Tips

### Build Time
- Incremental builds are faster
- Cache dependencies with `npm ci`
- Use `--cache` flag when available

### Runtime
- Use connection pooling for database
- Lazy load components in Next.js
- Monitor bundle size
- Profile with DevTools

### Database
- Index frequently queried fields
- Use select to limit returned data
- Batch operations when possible
- Monitor slow queries

---

**Last Updated**: May 9, 2026
**Version**: 1.0
**Status**: Active
