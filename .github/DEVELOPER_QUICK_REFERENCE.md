# 👨‍💻 Developer Quick Reference

## Before You Push

### Run These Commands
```bash
# Type check
npx tsc --noEmit

# Fix lint issues
npm run lint --fix

# Build (this takes ~15 min)
npm run build

# Check migrations
npx prisma migrate status

# Only then...
git push origin your-branch
```

### Time Savings
Running locally **prevents** 30-minute CI waits:
```
No checks: 30 min wait ❌
Local checks: 5 min local + instant CI ✅
```

---

## CI Status Checks Explained

### ✅ Green (Merge Ready)
```
✅ typecheck
✅ build
✅ lint
✅ migrations
✅ quality-gate-summary
```
→ You can merge (after code review)

### 🔴 Red (Fix Before Push)
```
❌ build
```
→ Don't push until you fix locally

### ⏳ Yellow (Still Running)
→ Wait for it to complete

---

## Common Errors & Fixes

### Error: "Cannot find module"
```
error TS2339: Property 'phone' does not exist on type 'User'
```
**Fix**: Add property to interface in `src/context/AuthContext.tsx`

### Error: "Build failed"
```
error: Unknown page route: /analytics/attendance
```
**Fix**: Check if file exists. Restore from git if deleted.

### Error: "Lint failed"
```
✖ 12 problems (unused imports)
```
**Fix**: Run `npm run lint --fix` then commit

### Error: "Migration pending"
```
The following migrations have not yet been applied:
20260504205502_add_flexible_pricing
```
**Fix**: 
```bash
npx prisma migrate dev --name describe_change
git add prisma/migrations/
git commit -m "add migration"
```

---

## Git Workflow

### Standard Flow
```bash
# 1. Create branch
git checkout -b feature/add-coaching-tier

# 2. Make changes
# ... edit files ...

# 3. Test locally
npm run build              # Full test
npx tsc --noEmit         # Just types
npm run lint --fix       # Fix linting

# 4. Commit
git commit -m "feat: add coaching tier pricing"

# 5. Push (CI runs automatically)
git push origin feature/add-coaching-tier

# 6. Wait for CI (watch Actions tab)
# All green? → Create Pull Request
# Red? → Fix locally, push again
```

### Emergency Push (Rare)
```bash
git push origin --force-with-lease
# Only if you REALLY know what you're doing
# Avoid this pattern
```

---

## When CI Fails

### 1. Click the Details Link
![GitHub PR with CI status]

Shows exactly which job failed

### 2. Read the Error
Most errors point to the file and line number

### 3. Fix It
```bash
cd /home/wilfred/TennisTracker
# ... make changes ...
npm run build  # Verify locally
git add .
git commit -m "fix: resolve build error"
git push
```

### 4. CI Re-runs Automatically
No need to do anything - GitHub sees new commits

---

## Useful Commands

### Just Check Types
```bash
npx tsc --noEmit
# Fast way to verify TypeScript without building
```

### Just Build
```bash
npm run build
# Takes ~15 min, but don't push until this passes
```

### Just Lint
```bash
npm run lint           # Show errors
npm run lint --fix    # Fix automatically
```

### Check Migrations
```bash
npx prisma migrate status   # What's pending?
npx prisma migrate dev      # Create new migration
npx prisma db push          # Sync schema (dev only!)
```

### Watch Build Output
```bash
npm run build 2>&1 | head -50  # First 50 lines
npm run build 2>&1 | tail -20  # Last 20 lines
```

---

## Branch Protection (What It Means)

### If You See This
```
✅ All required checks have passed
✅ This branch has 1 approved review
✅ This branch is up to date

You can merge!
```

### If You See This
```
⚠️ This branch has 2 failing checks
❌ typecheck
❌ build

You cannot merge - fix the errors first
```

---

## Common Mistakes to Avoid

### ❌ Pushing Without Testing
```bash
git push  # If this fails CI, 15-min wait for nothing
```
**Better**:
```bash
npm run build && git push  # Only push if local build works
```

### ❌ Ignoring Build Warnings
```
⚠️ 5 unused variables
→ Just push anyway?
```
**Better**: Fix before pushing

### ❌ Force Pushing After PR Created
```bash
git push --force origin feature-branch
```
**Better**: Let CI finish, then push normally if needed

### ❌ Merging Red PR
```
❌ build is failing
→ Merge anyway?
```
**Better**: Fix and re-push

---

## Performance Tips

### Slow Local Build?
```bash
# Clear cache
rm -rf node_modules/.cache
rm -rf .next

# Reinstall
npm ci
npm run build
```

### Slow CI Pipeline?
→ Can't fix locally, contact maintainers
→ Might be database service, GitHub runners, etc.

### Dependencies Getting Stale?
```bash
npm outdated      # Show what's outdated
npm update        # Update to latest safe versions
npm audit         # Check for vulnerabilities
```

---

## Understanding Status Checks

### Required (Must Pass to Merge)
```
✅ typecheck       ← You must fix if this fails
✅ build          ← You must fix if this fails
✅ lint           ← You must fix if this fails
✅ migrations     ← You must fix if this fails
```

### Informational (Nice to Have)
```
ℹ️ tests          ← Good signal, but not blocking
```

---

## Commit Message Format

### Good
```
feat: add coaching tier pricing support

- Implement tier-based pricing logic
- Add database migrations for pricing rules
- Update UI to show tier information
- Add tests for pricing calculations
```

### Okay
```
feat: add coaching tier pricing
```

### Bad
```
updated stuff
```

**Why good commit messages?**
- CI reports reference them
- Git history becomes searchable
- Team understands *why* changes happened
- Makes debugging easier

---

## When Things Go Wrong

### "CI says it's broken, but it works locally"
→ Differences:
- Different Node version? (Check env in workflow)
- Different database? (Check service config)
- Network issues? (Re-run CI)

**Solution**: 
```bash
docker run -it node:20 bash
# Run inside Docker to match CI environment
npm run build
```

### "Build was green, now it's red"
→ Probably:
- Someone merged breaking changes to main
- Dependencies got updated
- Database got corrupted

**Solution**:
```bash
git fetch origin main
git rebase origin/main    # Rebase on latest
npm ci                    # Fresh dependencies
npm run build             # Rebuild
```

### "How do I see the full CI logs?"
→ Click the failing check name in GitHub PR
→ Scroll to bottom for error details

---

## Quick Checklist Before Pushing

- [ ] `npm run build` passes locally
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npm run lint --fix` shows no errors
- [ ] `npx prisma migrate status` shows no pending migrations
- [ ] Changes are committed with clear message
- [ ] Ready to wait 30 minutes for CI

---

## Questions?

**Q: Why does it take 30 minutes?**
A: Build optimization + TypeScript compilation. Normal for production builds.

**Q: Can I merge before CI finishes?**
A: No - GitHub won't let you. It's a feature, not a bug.

**Q: My PR is blocked, what do I do?**
A: Read the error → Fix locally → `git push` → CI re-runs

**Q: Why are my changes still showing up in another PR?**
A: You might not have pushed. Check: `git push origin your-branch`

**Q: How do I run tests?**
A: Tests are informational (non-required). Run: `npm run test:pilot`

---

## Slack Notification (Coming Soon)

Eventually, CI will notify Slack:
```
🚀 PR #42: Add coaching tiers
✅ typecheck
✅ build
✅ lint
✅ migrations
⏳ tests
→ Ready for review in #dev channel
```

For now, check GitHub Actions tab manually.

---

## Remember

**Broken builds are GOOD - they stop bad code**

If you see:
```
❌ Build Failed
```

This is your safety net working. Fix it. All good.

If you see:
```
✅ Build Passed
✅ Tests Passed
✅ Quality Gate Passed
```

Now you're confident the code is actually ready.

**That's the whole point.** 🚀
