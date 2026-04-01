# Vico

Vico is a comprehensive sports ecosystem platform designed to serve tennis players, coaches, referees, staff, and organizations. Built as a full-stack application, it combines a web interface using Next.js, a mobile app developed with Flutter, a robust backend powered by Prisma ORM and PostgreSQL, and additional integrations like gRPC for efficient communication. The platform enables seamless coordination of tournaments, training sessions, court bookings, memberships, analytics, communication, finance, and more, fostering a complete tennis community experience.

The project structure includes:
- **Web Application**: A Next.js-based dashboard and user interface for managing all platform features.
- **Mobile Application**: A Flutter app providing on-the-go access for players and staff.
- **Backend Services**: Prisma for database management, with migrations and seeding scripts.
- **Communication Layer**: gRPC protocol buffers for structured data exchange.
- **Deployment and Infrastructure**: Configurations for cloud deployment, including Vercel and other platforms.
- **Utilities and Scripts**: Automation scripts for data seeding, organization management, and more.

---

## 🚀 Key Capabilities

### 🔐 Authentication & User Management
- **Multi-role user system** with 7 distinct roles: Players, Coaches, Referees, Organizations, Finance Officers, Admins, and Spectators
- **Secure password authentication** with role-based access control
- **Flexible profile management** - Personal information, photos, bio, demographics
- **Organization creation and management** - Clubs, teams, and academies with full branding control
- **Permission management** - Granular RBAC for each organization role

### 👥 Player & Community Features
- **Personal dashboards** with match statistics (wins/losses/win rate), current ranking, and upcoming matches
- **Social profiles** - Follow other players, view achievements and badges
- **Community activity feed** - Post updates, share achievements, engage with other players
- **Comment and reaction system** - Discuss posts, react with emojis
- **Leaderboard integration** - Compete for rankings within your organization
- **Achievement badges** - Earn and display accomplishments and milestones
- **Attendance tracking** - Monitor participation in events and training sessions
- **Performance point tracking** - Historical performance data and trends

### 🏛️ Organization & Club Management
- **Complete club administration** - Create organizations with branding, location, and contact information
- **Member management system** - Add, remove, and organize club members with role assignments
- **Staff role setup** - Define roles (Admin, Coach, Finance Officer, Organizer, Referee) with specific permissions
- **Real-time activity monitoring** - Dashboard showing all player actions (bookings, registrations, payments)
- **Organization ratings** - Community ratings by facilities, coaching quality, community atmosphere, and value
- **Reputation tracking** - Activity scores, player development scores, tournament engagement metrics
- **Audit logs** - Complete history of all administrative changes

### 🏌️ Court & Booking Management
- **Court creation and management** - Define surface types (clay, hard, grass, carpet, artificial), indoor/outdoor status, lighting
- **Court details** - Set amenities, rules, maximum capacity, maintenance schedules
- **Multi-photo uploads** - Add multiple court images with positioning and scaling controls
- **Real-time availability** - Browse 1-hour time slots with live status updates
- **Advanced court search** - Filter by surface, location, indoor/outdoor, lighting, city
- **Dynamic pricing system** - Peak vs. off-peak pricing with adjustable premiums (25-50% increase during 5-9 PM)
- **Multiple booking types** - Regular play, tournaments, maintenance, guest bookings
- **Guest management** - Track group bookings and guest counts
- **Instant booking confirmation** - Immediate confirmation with receipts and details
- **Cancellation management** - Cancel with reason tracking and status updates
- **Court feedback system** - 1-5 star ratings and detailed reviews from players
- **Complaint tracking** - Report issues with severity levels (low/medium/high) and resolution status

### 🏆 Tournament & Event Management
- **Multiple event types** - Tournaments, clinics, social matches, training sessions, coaching sessions
- **Tournament creation** - Define event details, dates, entry fees, prize pools
- **Registration management** - Control capacity, set registration deadlines, manage confirmations
- **Automatic waitlisting** - Players queue when event reaches capacity
- **Bracket types** - Single elimination, double elimination, round-robin, or pool play
- **Auto-bracket generation** - Seed players based on rankings
- **Match scheduling** - Assign specific courts and times to matches
- **Set-by-set score recording** - Best-of-3 match tracking
- **Match status tracking** - Pending, scheduled, in-progress, completed, or walked-over
- **Referee assignment** - Assign officials and ball crew to matches
- **Announcements & notifications**:
  - General, schedule, results, or important announcements
  - Targeted distribution by member roles
  - Read receipt tracking
  - Scheduled/future publishing
- **Event reminders** - Automated reminders before tournaments
- **Tournament analytics** - Registration vs. capacity, revenue calculation, attendance tracking, results

### 💰 Payment & Financial Management
- **Triple payment integration**:
  - M-Pesa (mobile money for Kenya)
  - PayPal (credit card and PayPal)
  - Stripe (comprehensive card payments)
- **Automatic payment confirmation** via webhooks
- **Financial dashboard** - Monthly revenue overview with category breakdown
- **Revenue tracking by category**:
  - Membership fees
  - Court booking revenue
  - Tournament entry fees
  - Coach commissions
  - Event revenue
- **Transaction management** - Detailed transaction log with provider tracking
- **Member balance tracking** - Outstanding balances and payment status
- **Payment reminders** - Automatic reminders for due payments with read tracking
- **Monthly reports** - Automated financial summaries with profit/loss calculations
- **Expense tracking** - Record club expenses by category

### 👨‍🏫 Coaching & Staff Management
- **Coach profiles** with expertise areas, experience level, certifications, and languages spoken
- **Coaching services** - Define session types (individual, group, clinic), durations, age groups, skill levels
- **Dynamic pricing** - Base pricing with package discounts and junior rates
- **Availability management** - Set weekly schedules with student capacity limits
- **Coach ratings** - 1-5 star player reviews with verification badges
- **Staff assignment** - Assign coaches/staff to tournaments and events with specific roles
- **Task management** - Create tasks with priority levels and status tracking
- **Commission tracking** - Calculate and manage coach earnings
- **Audit logs** - Track all coaching record changes

### 🏅 Ranking & Challenge System
- **Weekly rankings** - Updated automatically based on win/loss records
- **Ranking calculations** - Weighted by wins, losses, and rating points
- **Historical tracking** - Compare current rank to previous rankings
- **Challenge system** - Players can challenge others to ranking matches
- **Automatic rank adjustments** - Standings update after challenge completion
- **Performance trends** - Visualize ranking changes over time

### 💬 Communication & Messaging
- **Real-time chat system** - Direct messages and group chat rooms
- **Message features**:
  - Read receipts and delivery tracking
  - Emoji reactions
  - Reply/quote functionality
  - Soft delete capability
  - Online status indicators
- **Club announcements** - Broadcast to specific member roles
- **Announcement types** - General, schedule, results, important notices
- **Read tracking** - See which members read announcements
- **Event reminders** - Customizable reminder timing
- **WebSocket integration** - Real-time message delivery and notifications

### 📊 Analytics & Reporting
- **Attendance analytics** - Track present/absent status with engagement reports
- **Performance analytics** - Performance points, trends, and player comparisons
- **Dashboard visualizations** - Charts for revenue, attendance, expenses, performance
- **Organization activity feed** - Real-time log of:
  - Court bookings
  - Tournament registrations
  - Ranking challenges
  - Payments received
  - Member joinings
- **Reports & export** - Automated monthly summaries, member reports, revenue breakdowns
- **PDF generation** - Export reports for sharing and archival

### 🎮 Community & Social Features
- **Post creation** - Share updates, photos, achievements
- **Commenting system** - Reply to posts with nested threads
- **Reactions & engagement** - Like posts and comments with emoji reactions
- **User network** - Follow players, build connections, see follower lists
- **Feed types** - Personal feed, explore/discover, tournament discussions, activity feeds
- **Share counter** - Track how many times posts are shared

### 🏅 Referee & Match Management
- **Referee profiles** - Track experience, certifications, expiration dates
- **Referee assignment** - Assign officials to matches
- **Ball crew management** - Assign and track ball crew assignments
- **Match records** - Complete match information and results
- **Score recording** - Set-by-set scores with official results
- **Match status** - Pending, completed, or walked-over matches
- **Referee statistics** - Total matches refereed and ratings

### 👑 Membership & Tiers
- **Custom membership tiers** - Create levels (Gold, Silver, Junior, etc.)
- **Tier benefits** - Define benefits and privileges per tier
- **Flexible pricing** - Monthly or annual pricing with auto-renewal
- **Court allocations** - Monthly court hours included per tier
- **Booking limits** - Set concurrent bookings per tier
- **Discount rates** - Percentage discounts for each membership level
- **Member onboarding** - Add members, send invitations, bulk imports
- **Member directories** - Search, view profiles, and access member history
- **Outstanding balance tracking** - Monitor unpaid memberships

### 🔧 Advanced Features
- **Inventory management** - Track equipment (rackets, balls, nets) with condition status and stock counts
- **Tennis rules database** - Standard rules reference with custom organization rules
- **Rule appeals** - Players can appeal decisions with management response tracking
- **Service marketplace** - Coaches and trainers offering services with pricing
- **Amenity bookings** - Reserve event amenities (food, lodging, parking) with capacity management
- **Customizable organizations** - Multiple levels of operation within single platform
- **Full audit trails** - Complete history of administrative actions for compliance

### 📱 Mobile App Features (Flutter)
- **Native iOS & Android apps** - Full-featured companion applications
- **User authentication** - Secure login on mobile devices
- **Profile management** - View and edit profiles from mobile
- **Push notifications** - Real-time alerts for tournaments, messages, and updates
- **Match management** - View upcoming matches, enter scores, check results
- **Court booking** - Browse and reserve courts from mobile app
- **Real-time chat** - Message conversations and room participation
- **Announcements** - Receive and view club announcements
- **Player dashboard** - Personal statistics, leaderboard, quick actions
- **Responsive design** - Optimized for mobile screens with single-hand usability
- **Offline support** - Some features available without internet connection

### 🔌 Technical Capabilities
- **Real-time infrastructure** - WebSocket server with live chat and notifications
- **Multi-tenant architecture** - Support for unlimited organizations
- **Scalable database** - PostgreSQL with Prisma ORM
- **gRPC support** - Efficient service-to-service communication
- **API-first design** - Comprehensive RESTful APIs
- **Security features** - JWT authentication, role-based authorization, data encryption
- **Comprehensive testing data** - Pre-seeded with realistic scenarios:
  - 3 organizations with 6 admin accounts
  - 18 courts across organizations
  - 493+ realistic court bookings
  - 18+ tournaments and events
  - Complete member and transaction history

---

## 📱 Mobile Application
The mobile app, built with Flutter, extends the platform's functionality to mobile devices, allowing users to access key features on the go. It includes:
- User authentication and profile management.
- Match scheduling, score tracking, and tournament participation.
- Real-time chat and announcements.
- Court booking and inventory checks.
- Analytics dashboards for personal performance and attendance.
- Integration with the web backend for seamless data synchronization.

The app supports both Android and iOS, providing a native-like experience across platforms.

---

## 🖥️ Web Application
The web interface, developed with Next.js, serves as the central hub for comprehensive management. It features:
- Responsive dashboards for different user roles (players, coaches, admins).
- Interactive components for analytics, such as charts and performance metrics.
- Forms and interfaces for registering events, managing memberships, and handling finances.
- Real-time updates for chat and notifications.
- Custom hooks and context providers for state management and authentication.

---

## 🗄️ Backend and Data Integration
- **Database**: PostgreSQL with Prisma ORM for schema definition, migrations, and data seeding.
- **gRPC Integration**: Protocol buffers defined in `tennis.proto` enable efficient, typed communication between services.
- **Scripts and Automation**: Utility scripts for seeding data, listing organizations, and other maintenance tasks.
- **Workers and Hooks**: Background workers for processing tasks, and custom React hooks for frontend logic.

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

## 🚀 Deployment and Infrastructure
The platform is designed for scalable deployment:
- **Web App**: Deployable on Vercel or similar platforms, with configurations in `wrangler.toml` for Cloudflare integration.
- **Database**: Managed PostgreSQL instances, with migration support via Prisma.
- **Mobile App**: Build and distribute via app stores, with CI/CD pipelines.
- **Infrastructure**: Includes Docker support and environment-specific configurations for development and production.

Refer to `DEPLOYMENT.md` for detailed deployment instructions.

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

For the mobile app, navigate to the `vico_app/` directory and follow the Flutter setup instructions in its README.

---

## 📘 Learn More

- [Next.js Documentation](https://nextjs.org/docs) – learn about Next.js features and API.
- [Prisma Documentation](https://www.prisma.io/docs) – understand the ORM and schema definitions.
- [Tailwind CSS](https://tailwindcss.com/docs) – utility‑first styling guide.
- [Flutter Documentation](https://flutter.dev/docs) – get started with Flutter development.
- [gRPC Documentation](https://grpc.io/docs/) – learn about gRPC and protocol buffers.

---

## ☁️ Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

