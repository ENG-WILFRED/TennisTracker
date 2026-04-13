# 🎾 VICO - Tennis Tracker Platform

**Vico** is a comprehensive sports ecosystem platform designed for the complete tennis community. It serves players, coaches, referees, staff, and organizations with seamless coordination tools for tournaments, training, court bookings, analytics, finance, and community engagement.

Built as a full-stack application combining Next.js web interface, Flutter mobile app, Prisma ORM with PostgreSQL database, and gRPC microservices architecture.

## 📦 Project Structure
- **Web Application** - Next.js 15.5.3 dashboard with responsive UI for all user roles
- **Mobile Application** - Flutter app for iOS/Android with offline support
- **Backend Services** - Prisma ORM, PostgreSQL database, RESTful APIs
- **Communication Layer** - Real-time WebSocket, gRPC protocol buffers
- **Infrastructure** - Vercel/Cloudflare deployment ready

---

## 🎯 Complete Feature List (A-Z)

### **A - Authentication & Authorization**
- **Account Registration** - Email/password account creation with profile setup for all user types
- **Role-Based Access Control (RBAC)** - 7 distinct roles with granular permissions:
  - Players (individual athletes)
  - Coaches (training professionals)
  - Referees (match officials)
  - Staff (administrators, organizers)
  - Finance Officers (payment management)
  - Organization Admins (club management)
  - Spectators (view-only access)
- **Multi-Factor Authentication** - Secure login with JWT tokens and session management
- **Profile Management** - Personal information, photos, bio, demographics (age, nationality, gender)

### **B - Bookings & Reservations**
- **Court Booking System** - Reserve 1-hour court time slots with real-time availability
- **Dynamic Pricing** - Peak (5-9 PM: +25-50%) vs off-peak pricing with seasonal adjustments
- **Booking Cancellation** - Cancel with reason tracking and automated refund processing
- **Booking Confirmation** - Instant confirmation with receipts, email notifications, and booking references
- **Amenity Bookings** - Reserve food, lodging, parking, equipment with capacity management
- **Group Bookings** - Support guest names and count tracking
- **Cancellation Fees** - Configurable penalty fees for late cancellations

### **C - Coaching & Staff**
- **Coach Profiles** - Experience level, expertise areas, certifications, languages, ratings
- **Coaching Services** - 1-on-1 sessions, group classes, clinics with age/skill level targeting
- **Session Scheduling** - Weekly availability management with student capacity limits
- **Coach Ratings** - 1-5 star player reviews with verification badges and feedback
- **Staff Assignment** - Assign coaches/staff to tournaments with specific roles
- **Commission Tracking** - Calculate and manage coach earnings with payout requests
- **Coaching Dashboard** - KPI tracking, session management, player analytics, earnings view
- **Certifications** - Track credentials with issue/expiration dates and verification status
- **Coach Wallet System** - Ledger-style accounting, commission storage, payout management

### **D - Dashboard & Analytics**
- **Role-Specific Dashboards** - Customized views for players, coaches, referees, admins, finance officers
- **Player Dashboard** - Quick stats, wins/losses, ranking, upcoming matches, personal leaderboard
- **Coach Dashboard** - Active students, session schedule, earnings, player performance metrics
- **Admin Dashboard** - Organization overview, member activity, financials, compliance status
- **Analytics Section** - Revenue trends, attendance rates, player performance, expense tracking
- **Attendance Analytics** - Track present/absent status with engagement reports
- **Performance Analytics** - Performance points, trends, player comparisons over time
- **Financial Dashboard** - Monthly revenue breakdown by category, profit/loss calculations

### **E - Events & Tournaments**
- **Tournament Creation** - Define name, description, dates, location, entry fees, prize pools
- **Event Types** - Tournaments, clinics, social matches, training sessions, coaching sessions
- **Registration Management** - Set capacity, registration deadline, confirmation status tracking
- **Automatic Waitlisting** - Queue players when event reaches capacity with admission notifications
- **Bracket Types** - Single elimination, double elimination, round-robin, pool play
- **Auto-Bracket Generation** - Seed players based on current rankings and ratings
- **Match Scheduling** - Assign specific courts and times to matches
- **Tournament Announcements** - Broadcast updates to registered participants
- **Event Reminders** - Automated emails/SMS reminders before tournaments
- **Tournament Analytics** - Registration vs capacity, revenue, attendance, results tracking

### **F - Finance & Payments**
- **Triple Payment Integration**:
  - M-Pesa (mobile money for Kenya/Africa)
  - PayPal (credit card and PayPal wallets)
  - Stripe (comprehensive card payments, invoicing)
- **Transaction Management** - Detailed ledger with provider, amount, status, date tracking
- **Automatic Webhook Confirmation** - Real-time payment status processing
- **Payment Reminders** - Automated follow-ups for outstanding payments with read tracking
- **Outstanding Balance Tracking** - Monitor unpaid memberships and fees by member
- **Revenue Reporting** - Monthly summaries, category breakdowns, profit/loss calculations
- **Expense Tracking** - Record club expenses by category with payment method
- **Recurring Billing** - Automated membership fee collection with auto-renewal options
- **Invoice Generation** - PDF invoices for court rentals, memberships, services
- **Member Balance Visibility** - Transparent payment history and current standing

### **G - Gaming & Gamification**
- **Achievement Badges** - Earn badges for milestones (tournament wins, consistent play, etc.)
- **Performance Points System** - Accumulate points based on match results and participation
- **Leaderboards** - Organization-wide rankings, skill-level divisions, monthly competitions
- **Challenge System** - Players challenge others to ranking matches with automatic rank updates
- **Statistics Tracking** - Career wins/losses, win rate, head-to-head records
- **Progress Tracking** - Visual progress toward achievements and next tier milestones

### **H - Hosting & Infrastructure**
- **Multi-Tenant Architecture** - Support unlimited organizations within single platform
- **Scalable Database** - PostgreSQL with Prisma ORM for data integrity
- **Real-Time Infrastructure** - WebSocket server for live chat, notifications, updates
- **API-First Design** - Comprehensive RESTful APIs for all features
- **Environment Configuration** - Dev/staging/production support with separate databases
- **Cloudflare Integration** - CDN support, WAF, DNS management via wrangler.toml
- **Docker Support** - Containerized deployment for cloud environments

### **I - Inventory & Resources**
- **Equipment Tracking** - Rackets, balls, nets, other equipment with condition status
- **Stock Management** - Current inventory count, reorder levels, depletion tracking
- **Maintenance Schedules** - Track court maintenance windows and resource availability
- **Court Amenities** - Define available amenities per court (lighting, showers, parking, etc.)
- **Resource Allocation** - Assign equipment for tournaments and training sessions

### **J - JSON & Data**
- **Data Export** - Export member lists, financial reports, tournament results as JSON/CSV
- **API Responses** - Structured JSON responses for all endpoints
- **Database Seeding** - Pre-loaded realistic test data for development

### **K - Knowledge Base & Rules**
- **Tennis Rules Database** - Standard ITF rules reference with custom organizational variations
- **Rule Appeals** - Players can contest decisions with admin response tracking
- **Help & Documentation** - In-app help sections, FAQ, tutorial videos
- **Custom Organization Rules** - Set house rules and regulations specific to each club

### **L - Listings & Directories**
- **Player Directories** - Search members by name, ranking, location, skill level
- **Court Listings** - Browse courts with filters: surface, indoor/outdoor, lighting, city
- **Coach Directories** - Find coaches by specialty, level, availability, ratings
- **Service Marketplace** - Browse coaches and training services with pricing and reviews
- **Tournament Listings** - Browse upcoming tournaments with filters by date, location, type

### **M - Messaging & Communication**
- **Real-Time Chat** - Direct messages and group chat rooms with WebSocket support
- **Message Features** - Read receipts, delivery tracking, emoji reactions, reply/quote
- **Soft Delete** - Messages marked as deleted but preserved in database for compliance
- **Online Status** - See who's currently online and active
- **Typing Indicators** - Real-time "user is typing" notifications
- **Club Announcements** - Broadcast messages by role (members, coaches, admins, etc.)
- **Message Search** - Search conversation history and archive
- **Rich Media Support** - Send/receive images, files, links

### **N - Notifications & Alerts**
- **Push Notifications** - Real-time alerts for tournaments, messages, match results
- **Email Notifications** - Booking confirmations, payment receipts, tournament updates
- **SMS Alerts** - Critical notifications delivered via SMS (optional)
- **In-App Notifications** - Activity feed with read/unread status
- **Notification Preferences** - User-controlled frequency and channel selection
- **Scheduled Notifications** - Queue announcements for future delivery
- **Notification Analytics** - Track open rates and engagement metrics

### **O - Organizations & Clubs**
- **Organization Creation** - Set up clubs, academies, teams with full branding
- **Organization Profiles** - Logo, branding colors, contact info, social media links
- **Member Management** - Add/remove members, assign roles, track member status
- **Multi-Level Operations** - Support complex organizational hierarchies
- **Organization Settings** - Customize rules, pricing, policies per organization
- **Activity Feed** - Real-time log of bookings, registrations, payments, member joinings
- **Organization Analytics** - Member engagement, revenue, tournament stats

### **P - Player Development & Performance**
- **Personal Dashboards** - Match history, current ranking, upcoming matches, statistics
- **Match Statistics** - Wins, losses, win rate, head-to-head records, performance trends
- **Performance Points** - Cumulative points system tracking progress over time
- **Ranking System** - Weekly rankings updated automatically based on match results
- **Skill Level Assessment** - Self-rated and coach-assigned skill levels
- **Player Profiles** - Detailed profiles with bio, achievements, availability, coaching history
- **Career Statistics** - Historical data, career high rankings, tournament participation record

### **Q - Quality Assurance & Compliance**
- **Audit Logs** - Complete history of all administrative and system actions
- **Data Validation** - Input validation and business logic constraints
- **Error Handling** - Graceful error messages and retry mechanisms
- **Backup & Recovery** - Automated database backups with restore capabilities
- **GDPR Compliance** - Data export, account deletion, privacy controls
- **Compliance Reporting** - Generate compliance reports for financial/legal requirements

### **R - Rankings & Ratings**
- **Weekly Rankings** - Updated automatically based on win/loss records
- **Ranking Calculations** - Weighted by wins, losses, rating points, strength of schedule
- **Historical Tracking** - Compare current rank to previous rankings and trends
- **Rating Points** - ELO-style rating system based on opponent strength
- **Skill Level Ratings** - Categorize players (beginner/intermediate/advanced/professional)
- **Coach Ratings** - 1-5 star ratings from coaching clients with verified reviews
- **Court Ratings** - Facility ratings by cleanliness, maintenance, conditions, value

### **S - Scheduling & Time Management**
- **Calendar Views** - Monthly calendar with event highlighting and detail views
- **Match Scheduling** - Assign specific courts and times to tournament matches
- **Availability Management** - Set weekly schedules for coaches and staff
- **Time Slots** - 1-hour booking slots with real-time availability updates
- **Scheduling Conflicts** - Automatic detection and resolution of double-bookings
- **Reminder System** - Automated reminders for upcoming matches, bookings, events
- **Recurring Events** - Set up repeating tournaments, training sessions, court maintenance

### **T - Tournaments & Competitions**
- **Tournament Management** - Create, schedule, manage tournaments with full lifecycle support
- **Bracket Management** - Automatic bracket generation with seeding algorithms
- **Match Scoring** - Best-of-3 set tracking with detailed score recording
- **Referee Assignment** - Assign officials and ball crew to specific matches
- **Results Tracking** - Final scores, winners, walk-overs, match status updates
- **Tournament Reporting** - Analytics on participation, revenue, attendance, results
- **Challenge Matches** - Special matches for ranking adjustments outside tournaments

### **U - User Experience & Interface**
- **Responsive Design** - Mobile-first, works on tablets and desktops
- **Dark Theme** - Professional dark color scheme with green accents
- **Native HTML Components** - No UI library dependencies, lightweight implementation
- **Accessible Navigation** - Clear menus, breadcrumbs, and information hierarchy
- **Real-Time Updates** - Instant updates without page reloads
- **Loading States** - Visual feedback during data fetching operations
- **Error Messages** - Clear, actionable error messaging and recovery options

### **V - Verification & Credentials**
- **Identity Verification** - Verify player, coach, and referee identities
- **Certification Verification** - Verify coach certifications with third-party validation
- **Badge System** - Verified badges for coaches and tournament officials
- **Expiration Tracking** - Monitor credential expiration dates and renewal reminders
- **Background Checks** - Optional screening for staff and referees

### **W - WebSocket & Real-Time**
- **Live Chat** - Real-time messaging with instant delivery and read receipts
- **Live Notifications** - Real-time alerts for events, messages, match updates
- **Presence Detection** - Live online/offline status for users
- **Typing Indicators** - See when others are typing in real-time
- **Live Match Updates** - Real-time score updates during tournament matches
- **Connection Management** - Automatic reconnection and fallback mechanisms

### **X - Extensibility & APIs**
- **RESTful APIs** - Comprehensive API endpoints for all platform features
- **API Documentation** - OpenAPI/Swagger documentation for developers
- **Webhook Support** - Payment webhooks, event webhooks for integrations
- **Third-Party Integrations** - Payment providers, communication services, analytics
- **Custom Fields** - Extensible data model allowing custom organization fields
- **Plugin Support** - Architecture ready for plugin-based extensions

### **Y - Yearly Planning & Forecasting**
- **Annual Reports** - Year-over-year comparison reports
- **Revenue Forecasting** - Project annual revenue based on historical data
- **Membership Planning** - Plan capacity and tier distribution for upcoming year
- **Tournament Calendar** - Year-long tournament schedule with planning tools
- **Budget Planning** - Set annual budgets and track spending against projections

### **Z - Zones & Geographic Features**
- **Location-Based Search** - Find courts and organizations by city/region
- **Service Area Definition** - Define geographic zones of operation
- **Regional Analytics** - Performance metrics broken down by location
- **Multi-Location Support** - Organizations with courts across multiple locations
- **Geo-Tagged Events** - Tournaments and events marked with location data
- **Distance Calculations** - Show distance from user to courts/facilities

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL 14+ database
- Flutter SDK (for mobile app)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/tennis-tracker.git
cd tennis-tracker

# Install web dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and API keys

# Run database migrations
npx prisma migrate dev

# Seed demo data (3 organizations, 18 courts, 493+ bookings, tournaments)
npm run seed

# Start development server
npm run dev
```

Access the platform at `http://localhost:3000`

### Test Accounts (password: tennis123)
| Role | Email |
|------|-------|
| Player | marcus.johnson@example.com |
| Coach | robert.coach@example.com |
| Referee | john.referee@example.com |
| Admin | admin@centraltennis.com |
| Finance | finance@centraltennis.com |

---

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Next.js 15.5.3 with TypeScript
- **Styling**: Tailwind CSS + custom inline styles
- **State Management**: React Hooks & Context API
- **Real-time**: WebSocket client integration
- **Components**: Custom components without UI library dependencies

### Backend Stack
- **ORM**: Prisma with PostgreSQL
- **API**: RESTful endpoints with JWT authentication
- **Real-time**: WebSocket server for chat and notifications
- **Services**: Modular service layer for business logic
- **Authentication**: JWT tokens, session management

### Mobile Stack
- **Framework**: Flutter (Swift/Kotlin native layer)
- **Features**: Push notifications, offline support, native UI

### Infrastructure
- **Deployment**: Vercel (web), App Stores (mobile)
- **Database**: PostgreSQL managed instances
- **CDN**: Cloudflare integration
- **Payments**: M-Pesa, PayPal, Stripe webhooks

---

## 📊 Database Schema Highlights

### Core Models
- **User** - Base user entity with 7 role types
- **Organization** - Clubs, academies, teams
- **Player** - Athlete profiles with stats
- **Staff** - Coaches, referees, administrators
- **Court** - Physical tennis courts with details
- **ClubEvent** - Tournaments, clinics, training sessions
- **CourtBooking** - Court reservations and availability
- **Match** - Individual match results and scoring
- **ClubMember** - Organization membership records
- **MembershipTier** - Pricing tiers with benefits

### Relationship Models
- **ChatRoom/ChatMessage** - Real-time messaging
- **PlayerRanking/RankingChallenge** - Ranking system
- **EventRegistration/EventWaitlist** - Tournament registration
- **ClubFinance/FinanceTransaction** - Financial tracking
- **TaskTemplate/Task** - Task assignment system
- **CoachSession/SessionBooking** - Coaching bookings
- **AuditLog** - Administrative action history

Total: 60+ interconnected models with full referential integrity

---

## 🔐 Security & Compliance

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: Passwords hashed with bcrypt
- **Rate Limiting**: API endpoint protection
- **GDPR Compliance**: Data export, deletion, privacy controls
- **Audit Logging**: Complete administrative action trails
- **Webhook Verification**: Signed payment webhook validation
- **SQL Injection Protection**: Prisma parameterized queries

---

## 📱 Mobile App Features

The Flutter mobile app mirrors web functionality with optimizations:
- **Authentication** - SSO with web platform
- **Offline Mode** - Core features work without internet
- **Push Notifications** - Real-time alerts for events
- **Biometric Login** - Face ID / fingerprint support
- **Camera Integration** - Photo uploads for profiles/courts
- **Location Services** - Map view of nearby courts
- **Background Sync** - Automatic data sync when online

---

## 💻 Web Application

### Pages & Components
| Page | Purpose |
|------|---------|
| `/dashboard` | Role-specific overview and quick actions |
| `/courts` | Browse and search courts |
| `/tournaments` | View and register for events |
| `/players` | Player directory and profiles |
| `/matches` | View match schedules and results |
| `/community` | Activity feed and social features |
| `/staff/manage` | Organization staff management |
| `/analytics/*` | Business intelligence and reporting |

### Key Components
- **AssignCard** - Task assignment form with role-specific fields
- **TaskCard** - Display and manage task status
- **CalendarView** - Month view with events
- **FinanceDashboard** - Revenue and expense tracking
- **CoachDashboard** - Session and student management
- **TournamentBracket** - Visual bracket display

---

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create account
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Player Management
- `GET /api/players` - List players
- `GET /api/players/[id]` - Player profile
- `POST /api/players` - Update profile

### Court Management
- `GET /api/courts` - List courts
- `GET /api/courts/[id]` - Court details
- `GET /api/organization/[orgId]/courts` - Organization courts
- `POST /api/organization/[orgId]/courts/booking` - Create booking

### Tournament Management
- `GET /api/tournaments` - List tournaments
- `GET /api/tournaments/[id]` - Tournament details
- `POST /api/tournaments/[id]/register` - Register for tournament

### Coaching
- `GET /api/coaches/available` - List available coaches
- `POST /api/coaches/sessions` - Schedule session
- `GET /api/coaches/[id]/reviews` - Coach reviews

### Financial
- `GET /api/organization/[orgId]/transactions` - Transaction history
- `GET /api/organization/[orgId]/reports/monthly` - Monthly report
- `POST /api/payments/webhook` - Payment provider webhook

### Communication
- `GET /api/chat/rooms` - Chat rooms list
- `POST /api/chat/messages` - Send message
- `GET /api/announcements` - Organization announcements

### Task Management
- `POST /api/admin/tasks/assign` - Assign task to user
- `GET /api/admin/task-templates` - Available task templates
- `PATCH /api/admin/tasks/[id]/status` - Update task status

---

## 📊 Seeding & Test Data

The platform comes pre-seeded with realistic data:

```bash
npm run seed
```

**Includes:**
- 3 Organizations (Tennis Clubs, Academies, Communities)
- 14 Demo Users (players, coaches, referees, admins)
- 18+ Courts with varied surfaces and amenities
- 1,150+ Court bookings across 6 months
- 10,000+ Payment records
- 5+ Tournament events with brackets and results
- 300+ Chat messages
- 20 Player rankings and historical data
- 7 Task templates for referees and coaches

---

## 🧪 Development

### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Linting & Formatting
```bash
npm run lint          # Run ESLint
npm run format        # Format with Prettier
npm run type-check    # TypeScript type checking
```

### Database Management
```bash
npx prisma studio          # Visual database explorer
npx prisma migrate dev      # Create and apply migrations
npx prisma db push          # Push schema to database
npx prisma generate         # Generate Prisma Client
```

---

## 🐛 Troubleshooting

### Common Issues

**Port 3000 already in use**
```bash
# Use alternative port
PORT=3001 npm run dev
```

**Database connection error**
- Verify DATABASE_URL in .env.local
- Ensure PostgreSQL is running
- Check connection credentials

**API returning 401 Unauthorized**
- Ensure JWT token is included in Authorization header
- Check token expiration and refresh if needed
- Verify user role has permission for endpoint

**WebSocket connection failed**
- Check WEBSOCKET_URL environment variable
- Verify WebSocket server is running
- Check firewall and proxy settings

---

## 📚 Documentation

### Comprehensive Guides
- [API Reference](./documentation/API_ROUTES_AND_DATA_STRUCTURES.md)
- [Booking & Checkout Flow](./documentation/BOOKING_AND_CHECKOUT_COMPLETE.md)
- [Coach Dashboard Setup](./documentation/COACH_DASHBOARD_QUICK_START.md)
- [Referee System](./documentation/REFEREE_SYSTEM_SUMMARY.md)
- [Community Implementation](./documentation/COMMUNITY_QUICK_START.md)
- [Deployment Guide](./documentation/DEPLOYMENT.md)
- [Event System](./documentation/EVENTS_SYSTEM_README.md)
- [Messaging & Registration API](./documentation/MESSAGING_AND_REGISTRATION_API_REFERENCE.md)

---

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE.md file for details.

---

## 🔗 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma ORM Guide](https://www.prisma.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Flutter Development](https://flutter.dev/docs)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## 📞 Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation sections

---

## 🎯 Roadmap

### Planned Features
- [ ] Mobile app iOS/Android release
- [ ] Advanced analytics with ML predictions
- [ ] Video coaching integration
- [ ] Sponsorship marketplace
- [ ] Tournament bracket livestream
- [ ] In-app video calls for coaching
- [ ] Advanced scheduling with AI optimization
- [ ] Export functionality (PDF, CSV, Excel)
- [ ] Multi-language support (i18n)
- [ ] Dark mode for mobile app

---

**Built with ❤️ for the tennis community**

## ☁️ Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

