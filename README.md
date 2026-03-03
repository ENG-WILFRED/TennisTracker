# Vico

Vico is a comprehensive sports ecosystem platform built with Next.js, Prisma, Tailwind CSS and PostgreSQL. The platform provides a complete suite of tools for players, coaches, referees, staff and organizations to coordinate tournaments, training, court bookings, memberships, analytics, communication, finance and more.

---

## 🚀 Key Capabilities

### 🎟 Authentication & Profiles
- Support for **Players**, **Referees**, **Coaches/Staff** and **Organizations**.
- Detailed profiles with contact info, photos, bio, demographics and credentials.
- Password‑based login with role‑based access control.
- Organizations (clubs/teams) with ownership and member relationships.

### 🏢 Club & Organization Management
- Create and manage organizations with branding, location and contact data.
- Track club reputation via badges, ratings and activity scores.
- Role‑based permission system (`OrganizationRole` & `RolePermission`).
- Inventory tracking for equipment and resources per club or organization.
- Court management including surface, indoor/outdoor, status and maintenance.

### 🤝 Membership & Ranking
- Membership tiers (Gold, Silver, Junior, etc.) with pricing and benefits.
- Club member profiles capturing payment status, attendance and role.
- Rankings updated weekly with win/loss records and rating points.
- Challenge system to request ranking matches between members.

### 🏆 Events & Tournaments
- Support for club events: tournaments, clinics, trainings, social matches.
- Registration, waitlists, reminders, brackets and match scheduling.
- Bracket types: single elimination, double elimination, round robin, etc.
- Tournament matches with score tracking, court assignment and status.

### 🎾 Matches & Officials
- Record individual matches with players, scores and winners.
- Assign referees and ball crews to matches; track their statistics.
- Referee profiles include certifications, experience and ratings.

### 👨‍🏫 Coaching & Staff
- Staff profiles include roles, expertise, availability, languages and more.
- Coach marketplace with pricing, packages, discounts and commission.
- Reviews and ratings from players; audit logs for administrative changes.

### 📊 Analytics & Performance
- Attendance logging for players with present/absent status.
- Performance points and rating data over time.
- Dashboard charts for attendance, performance, finances, etc.

### 💬 Communication
- Real‑time chat rooms, messages and participant presence tracking.
- Club announcements, alerts and read‑status tracking.
- Event reminders sent according to schedule.

### 🏟 Court & Booking System
- Define courts with surface, lighting and availability status.
- Bookings for members, guests, tournaments and maintenance.
- Peak‑hour pricing, cancellation handling and guest management.

### 💰 Inventory & Finance
- Inventory items owned by clubs or organizations with condition and counts.
- Financial accounting with monthly revenues, expenses and transactions.
- Categories for memberships, bookings, events and coach commissions.

### 🔒 Security & Permissions
- Granular RBAC through `OrganizationRole` and `RolePermission` models.
- Roles such as Admin, Coach, Member, Finance Officer, Guest, etc.
- Permissions like manage_bookings, view_revenue, manage_rankings, etc.

### ⭐ Gamification & Reputation
- Badges for players (`Badge`, `PlayerBadge`) and organizations (`OrganizationBadge`).
- Club ratings with categories (facilities, coaching, community, value).

### 📚 Rules & Reference Data
- Standard tennis rules captured in `TennisRule` model for easy lookup.

---

## 🧱 Data Model Overview
The system leverages Prisma ORM and includes a comprehensive schema. Key models include:

- **Player**, **Referee**, **Staff** – user entities with profile and relation details.
- **Organization** – club/team entity connecting players, staff, courts, events, finances, etc.
- **Match**, **TournamentMatch**, **TournamentBracket**, **ClubEvent** – manage matches and tournaments.
- **Court**, **CourtBooking** – define physical courts and schedule reservations.
- **ClubMember**, **MembershipTier** – membership lifecycle and privileges.
- **PlayerRanking**, **RankingChallenge** – ranking calculations and challenges.
- **ClubEvent** and related models (**EventRegistration**, **EventWaitlist**, **EventReminder**) – event management.
- **ClubFinance**, **FinanceTransaction** – financial accountability per organization.
- **OrganizationRole**, **RolePermission** – role‑based access control.
- **ChatRoom**, **ChatMessage**, **ChatParticipant** – built‑in communication features.

Additional support models such as `Availability`, `CoachPricing`, `CoachReview`, `Specialization`, `Certification`, `AuditLog`, `Attendance`, `PerformancePoint`, `InventoryItem`, `ClubAnnouncement`, `ClubRating` and more power detailed functionality.

Each model includes timestamps (`createdAt`, `updatedAt`) and relational integrity rules to ensure consistency and traceability.

---

## 🛠️ Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

You can start editing the page by modifying `app/page.tsx`. The page auto‑updates as you edit the file.


## 📘 Learn More

- [Next.js Documentation](https://nextjs.org/docs) – learn about Next.js features and API.
- [Prisma Documentation](https://www.prisma.io/docs) – understand the ORM and schema definitions.
- [Tailwind CSS](https://tailwindcss.com/docs) – utility‑first styling guide.


## ☁️ Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

