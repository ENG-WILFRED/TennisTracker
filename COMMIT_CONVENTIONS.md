# Commit Message Convention

This project follows a structured commit message format to maintain clarity and track changes effectively.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to build process, dependencies, or tools
- **ci**: Changes to CI/CD configuration
- **db**: Database schema changes or migrations

## Scope

The scope should specify what is being changed:
- `auth`: Authentication related
- `api`: API endpoints
- `db`: Database schema
- `ui`: User interface
- `coach-dashboard`: Coach dashboard features
- `analytics`: Analytics features
- `pricing`: Pricing system
- `migrations`: Database migrations

## Subject

- Use imperative, present tense: "add" not "added" or "adds"
- Don't capitalize first letter
- No period (.) at the end
- Limit to 50 characters
- Be specific about what changed

## Body

- Wrap at 72 characters
- Explain **what** and **why**, not **how**
- Separate from subject with a blank line
- Use bullet points for multiple changes

## Footer

- Reference related issues: `Closes #123`
- Note breaking changes: `BREAKING CHANGE: description`
- Reference related commits

## Examples

### Feature
```
feat(coach-dashboard): add flexible pricing model

- Implement base organization pricing
- Add tier-based pricing override system
- Create coach-specific pricing rules
- Add pricing rule hierarchy logic

Closes #456
```

### Bug Fix
```
fix(db): resolve SessionPayment migration dependency

The migration was trying to alter a non-existent table.
Created new migration that properly defines table first.

Closes #789
```

### TypeScript/Build Fix
```
fix(build): resolve TypeScript compilation errors

- Fixed User interface missing phone/gender/bio fields
- Updated Prisma unique constraints from userId_orgId to userId_orgId_role
- Added useCallback import to OrganizationStaffSection
- Regenerated Prisma client

Tests passing, build successful.
```

### Database Migration
```
db: add flexible pricing tables and constraints

Created three new tables for pricing management:
- OrgCoachingPricing: Organization-level base pricing
- TierCoachingPrice: Tier-based pricing overrides
- CoachSpecificPrice: Coach-specific pricing rules

Added proper indexes and foreign keys for performance.
```

## Pre-Commit Checks

Our GitHub Actions workflow automatically:
1. ✅ Validates TypeScript compilation
2. ✅ Runs full build process
3. ✅ Checks linting rules
4. ✅ Verifies database migrations
5. ✅ Runs test suite
6. ✅ Generates quality report

All checks must pass before merging to main/develop.
