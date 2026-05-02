# Role Registration Data Requirements

This document describes the minimal data needed to register users and entities in TennisTracker for each role.
It focuses on only the necessary fields required by the current system and corresponding database models.

## 1. Core account data (required for every registration)
Every user account in the system must include the following data:

- `username` (string)
  - Unique identifier for login and display.
- `email` (string)
  - Unique account email.
- `password` (string)
  - Stored as a hash in the database.
- `firstName` (string)
- `lastName` (string)

These fields are required by the `User` model and the current registration flow in `src/app/register/page.tsx` and `src/actions/auth.ts`.

### Optional user profile fields
These are not required by core registration, but are supported and useful for profiles:

- `phone` (string, unique when provided)
- `photo` (string, URL or data URI)
- `gender` (string)
- `dateOfBirth` (Date or ISO string)
- `nationality` (string)
- `bio` (string)

The `User` model stores these optionally, and they are helpful for richer role profiles.

## 2. Player registration
Current system support:
- The main signup endpoint (`registerPlayer`) creates a `User` and a linked `Player` record.

### Minimal required data for a player
- `username`
- `email`
- `password`
- `firstName`
- `lastName`

### Optional player profile data
- `phone`
- `photo`
- `gender`
- `dateOfBirth`
- `nationality`
- `bio`

### Database mapping
- `User` stores the core account fields and optional profile fields.
- `Player` is created automatically as an empty player record linked to the user.

## 3. Referee registration
The `Referee` profile is linked to `User` and currently holds a small amount of referee-specific metadata.

### Minimal necessary data for a referee
- `username`
- `email`
- `password`
- `firstName`
- `lastName`

### Recommended role-specific fields
These are not enforced by the schema as required, but are necessary for a functional referee profile:
- `experience` (string)
- `certifications` (array of strings)

### Database mapping
- `User` stores the account and profile.
- `Referee` stores referee-specific fields and links to `User` through `userId`.

## 4. Coach / Staff registration
Coach and staff accounts are represented by the `Staff` model.

### Minimal necessary data for coach/staff
- `username`
- `email`
- `password`
- `firstName`
- `lastName`
- `role` (string)
  - Required by `Staff` and used to classify the staff profile.

### Recommended role-specific fields
- `expertise` (string)
- `contact` (string)
- `photo` (string)

### Database mapping
- `User` stores shared account and profile data.
- `Staff` stores the staff role and related metadata using `userId` as the primary key.

## 5. Spectator registration
A spectator is the lightest role in the schema.

### Minimal necessary data for a spectator
- `username`
- `email`
- `password`
- `firstName`
- `lastName`

### Optional spectator profile fields
- `phone`
- `photo`
- `gender`
- `dateOfBirth`
- `nationality`
- `bio`

### Database mapping
- `User` stores the account.
- `Spectator` is a simple linked record that tracks spectator status.

## 6. Organization creation
Organization setup is a separate entity creation flow, not part of the base user signup.

### Minimal necessary fields for an organization
- `name` (string)
  - Required and unique.

### Recommended organization fields
- `description` (string)
- `city` (string)
- `country` (string)
- `phone` (string)
- `email` (string)
- `primaryColor` (string)
- `logo` (string URL or data URI)

### Database mapping
- `Organization` stores the organization entity.
- The creator is linked via `createdBy` and their player record may be updated with `organizationId`.

## 7. Notes and current system behavior
- The current registration form in `src/app/register/page.tsx` is built for player signups.
- The backend `registerPlayer` flow is the only dedicated registration action currently implemented.
- Other roles (referee, staff, spectator) are represented by separate profile models, but a generic multi-role registration form is not present yet.
- Organization creation is handled through `src/components/organization/CreateOrgForm.tsx` and `src/app/api/organization/route.ts`.

## 8. Recommended minimal role data summary
| Role | Required fields | Role-specific required fields | Notes |
| --- | --- | --- | --- |
| Player | username, email, password, firstName, lastName | None | Auto-creates `Player` record. |
| Referee | username, email, password, firstName, lastName | Recommended: experience, certifications | `Referee` profile can remain minimal, but useful data should be captured. |
| Coach / Staff | username, email, password, firstName, lastName | role | `role` is essential for staff classification. |
| Spectator | username, email, password, firstName, lastName | None | Simple spectator linkage. |
| Organization | name | None | Created separately from user signup; should include contact info. |

This document is focused on the essential data required by the current schema and registration flows, without extra optional profile fields unless they are recommended for role completeness.