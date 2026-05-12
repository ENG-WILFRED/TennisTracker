# 🔐 Branch Protection Rules

This document explains how to configure GitHub branch protection rules to enforce the CI/CD quality gates.

## Why Branch Protection Matters

Branch protection rules ensure that:
- ✅ No broken code reaches production
- ✅ All required checks pass before merge
- ✅ Code reviews happen before deployment
- ✅ Team standards are enforced automatically

## Current Quality Gate Structure

### Required Checks (Must Pass)
These checks **BLOCK** the merge if they fail:
- `typecheck` - TypeScript compilation
- `build` - Next.js production build
- `lint` - Code quality standards
- `migrations` - Database migration validation

### Informational Checks (Non-Blocking)
These are for awareness but don't block merges:
- `tests` - Unit and integration tests

## How to Configure Branch Protection

### Step 1: Navigate to Settings
1. Go to your GitHub repository
2. Click **Settings** (gear icon)
3. Click **Branches** in the left sidebar

### Step 2: Add Rule for `main` Branch

Click **Add rule** and configure:

```
Branch name pattern: main
```

### Step 3: Enable Required Checks

Check these boxes:
- ✅ **Require a pull request before merging**
- ✅ **Require approvals** (suggest 1-2 reviews)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require branches to be up to date before merging**

### Step 4: Select Required Status Checks

Click **Require status checks to pass before merging** and search for:

```
✅ typecheck
✅ build
✅ lint
✅ migrations
✅ quality-gate-summary
```

These are your **required checks**. They will block the merge if any fail.

### Step 5: Configure Protection Rules

Also check:
- ✅ **Include administrators** (applies rules to admins too)
- ✅ **Restrict who can push to matching branches** (optional, for large teams)
- ✅ **Allow force pushes** - Select "Dismiss"
- ✅ **Require signed commits** (recommended for production)

### Step 6: Save the Rule

Click **Create** or **Update**

## Result: Your Merge Gate

Now when a PR is created:

```
┌─────────────────────────────────────────────┐
│  Pull Request Status Checks                 │
├─────────────────────────────────────────────┤
│  ✅ typecheck                  PASSED       │
│  ✅ build                       PASSED       │
│  ✅ lint                        PASSED       │
│  ✅ migrations                  PASSED       │
│  ✅ quality-gate-summary        PASSED       │
│                                              │
│  ✅ Code Review (2 approvals)   REQUIRED    │
│                                              │
│  ✅ All checks passed. Ready to merge!      │
└─────────────────────────────────────────────┘
```

## What Happens When a Check Fails

Example: If `build` fails:

```
┌─────────────────────────────────────────────┐
│  Pull Request Status Checks                 │
├─────────────────────────────────────────────┤
│  ✅ typecheck                  PASSED       │
│  ❌ build                       FAILED       │  ← BLOCKS MERGE
│  ✅ lint                        PASSED       │
│  ✅ migrations                  PASSED       │
│                                              │
│  ❌ Cannot merge - required status check    │
│     "build" is failing                      │
│                                              │
│  👉 Developer must fix the code and push    │
│     an update. Checks re-run automatically. │
└─────────────────────────────────────────────┘
```

## Develop Branch (Optional Staging)

For a staging/development workflow, create another rule for `develop`:

```
Branch name pattern: develop
```

With slightly relaxed requirements:
- ✅ Require 1 approval (instead of 2)
- ✅ Same required checks as `main`
- ❌ Don't require signed commits
- ✅ Allow stale PR dismissals

This allows faster iteration on develop while keeping main stable.

## Protecting Release Branches

If you add `release/*` branches, protect them like `main`:

```
Branch name pattern: release/*
```

With same strict rules as production.

## For Different Environments

### Production (`main`)
- Strictest rules
- Requires all checks
- Requires signed commits
- Requires 2+ approvals

### Staging (`develop`)
- Medium rules
- Requires all checks
- Requires 1 approval

### Feature Branches
- No protection needed
- Developers can push directly
- Only protected when merged via PR

## Troubleshooting

### "Checks are still running"
Wait for all CI jobs to complete. Each job has a timeout limit.

### "A required status check is failing"
Look at the CI logs and fix the issue. Common fixes:
- Build errors → fix TypeScript/syntax
- Lint errors → run `npm run lint --fix`
- Migration errors → run `npx prisma migrate status`
- Test errors → investigate in logs

### "I need to merge now, it's an emergency"
Administrators can:
1. Click **Merge without waiting for checks** (if repo allows)
2. Click **Merge anyway** (if you have admin override)

⚠️ Use sparingly and document why.

## Monitoring & Maintenance

Every week, check:
1. CI failure trends in **Actions** tab
2. PR merge times - should be < 24 hours
3. Blocked PRs - investigate delays

## Commands to Remember

After configuration, use these locally:

```bash
# Run all checks locally (before pushing)
npm run build          # Build check
npx tsc --noEmit      # TypeScript check
npm run lint          # Lint check
npx prisma migrate status  # Migration check

# Fix common issues
npm run lint --fix    # Auto-fix lint issues
npx tsc              # See all type errors

# Push and watch CI
git push origin feature-branch
# Now check GitHub Actions tab for status
```

## Questions?

Ask your team:
- "Are all required checks passing?"
- "Did you run `npm run build` locally?"
- "Is TypeScript validation clean?"
- "Are migrations valid?"

**Remember: Blocked merge = protected production. This is good.**
