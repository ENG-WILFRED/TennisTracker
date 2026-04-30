# Vico Architecture: LOCKED & READY FOR IMPLEMENTATION

**Date**: April 29, 2026  
**Status**: 🔒 ARCHITECTURE LOCKED - Ready for Development

---

## Executive Summary

The Vico operating model and architecture have been comprehensively documented and locked in. The system is built on **org-centric financial control, session-based workflows, and data-driven insights**.

**Key achievement**: The Prisma schema has been updated to support the complete architecture, with all required models in place.

---

## 📋 What's Been Locked

### 1. ✅ Operating Model (LOCKED)
**Document**: [VICO_OPERATING_MODEL_ARCHITECTURE.md](VICO_OPERATING_MODEL_ARCHITECTURE.md)

- **Org-centric payments**: Organizations are the financial hub, not coaches
- **Session backbone**: All data flows from sessions
- **Progress tracking**: Structured, time-series metrics with trends
- **Recommendations engine**: Data-driven insights for players, parents, coaches
- **Multi-layer reporting**: Role-specific reports for transparency
- **Clean financial system**: Org→Parent payments, Org→Coach payouts

### 2. ✅ Schema Review (LOCKED)
**Document**: [VICO_SCHEMA_REVIEW_AGAINST_ARCHITECTURE.md](VICO_SCHEMA_REVIEW_AGAINST_ARCHITECTURE.md)

- Comprehensive review of existing schema (100 models)
- Alignment assessment for each domain
- Priority 1 & 2 updates identified
- Implementation checklist provided

### 3. ✅ Schema Implementation (LOCKED)
**Updated File**: `prisma/schema.prisma`

**Changes made:**
- ✅ CoachSession: Added "confirmed" and "no-show" status states, added sessionType variations
- ✅ ProgressUpdate: Added coachId relationship for tracking who submitted updates
- ✅ OrgRevenue: Added fromParentId for guardian-based payments
- ✅ Staff: Added progressUpdates & coachReports relationships
- ✅ Player: Added playerReports, invoices, subscriptions relationships
- ✅ Organization: Added all new reporting & payment models relationships
- ✅ NEW: PlayerReport model (weekly/custom player progress snapshots)
- ✅ NEW: ParentReport model (simplified parent-facing reports)
- ✅ NEW: CoachReport model (coach performance & earnings dashboard)
- ✅ NEW: OrgAnalytics model (organization-level metrics & trends)
- ✅ NEW: Invoice model (parent invoicing system)
- ✅ NEW: PaymentMethod model (org payment configuration)
- ✅ NEW: Subscription model (recurring revenue)
- ✅ NEW: NotificationTrigger model (event-based notifications)

### 4. ✅ API Architecture (LOCKED)
**Document**: [VICO_API_AND_EVENT_ARCHITECTURE.md](VICO_API_AND_EVENT_ARCHITECTURE.md)

- Complete REST API design across all domains
- Event-driven workflow for session completion
- Background job scheduling (weekly analysis, payout processing)
- Notification trigger system with retry logic
- Admin operations & dashboard design
- Error handling & resilience patterns
- Rate limiting & security guidelines

---

## 🏗️ System Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                            │
├───────────────────────────────────────────────────────────────────┤
│  Parent App  │  Coach App  │  Admin Portal  │  Player App       │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│                      REST API LAYER                               │
├───────────────────────────────────────────────────────────────────┤
│ Identity │ Sessions │ Progress │ Payments │ Recommendations    │
│ Reporting │ Analytics │ Communications                           │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│                    EVENT QUEUE SYSTEM                             │
├───────────────────────────────────────────────────────────────────┤
│ SessionCompleted → MetricsUpdated → RecommendationsGenerated    │
│              ↓ NotificationsQueued ↓ RevenueRecorded            │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│               ASYNC EVENT HANDLERS                                │
├───────────────────────────────────────────────────────────────────┤
│ ProgressHandler │ MetricsHandler │ RevenueHandler │ EarningHandler│
│ RecommendationHandler │ NotificationDispatcher                    │
└───────────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                           │
├───────────────────────────────────────────────────────────────────┤
│ Users │ Memberships │ Sessions │ Progress │ Metrics │ Financials│
│ Reports │ Analytics │ Notifications │ Recommendations            │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow (The Core Loop)

```
Session Scheduled
  ↓
Session Confirmed (notification sent)
  ↓
Session Starts
  ↓
Session COMPLETED ⭐ EVENT TRIGGER
  ├─ Coach submits ProgressUpdate
  ├─ PlayerMetric updated & MetricHistory created
  ├─ OrgRevenue recorded (pending payment)
  ├─ CoachEarning calculated → CoachWallet updated
  ├─ Trend analysis performed
  ├─ Recommendations generated (if triggered)
  ├─ Notifications queued (parent, coach, admin)
  └─ Weekly analysis job checks all players
       ├─ Stagnation detected?
       ├─ Breakthrough detected?
       └─ Generate recommendations

↓

INSIGHTS GENERATED
  ├─ PlayerReport created (weekly)
  ├─ ParentReport created (simplified)
  ├─ CoachReport created (performance dashboard)
  └─ OrgAnalytics updated

↓

DECISIONS MADE
  ├─ Parent sees child's progress → enrolls in more sessions
  ├─ Coach sees recommendations → adjusts training plan
  ├─ Player sees goals → practices more
  └─ Admin sees metrics → manages pricing/staffing

↓

PAYMENTS FLOW
  ├─ Parent pays for services → OrgRevenue recorded
  ├─ Org collects → CoachEarning calculated
  ├─ Admin processes → CoachPayout sent
  └─ Cycle repeats
```

---

## 📚 Documentation Structure

### Core Documents (LOCKED)

1. **VICO_OPERATING_MODEL_ARCHITECTURE.md**
   - Complete operating model with all 14 key systems
   - Financial model (org-centric)
   - Session lifecycle & events
   - Progress tracking strategy
   - Recommendation engine design
   - Multi-layer reporting specs
   - Admin control panel requirements

2. **VICO_SCHEMA_REVIEW_AGAINST_ARCHITECTURE.md**
   - Current schema analysis (100 models reviewed)
   - Alignment assessment for each domain
   - Missing models identified
   - Priority 1 & 2 updates
   - Implementation checklist

3. **VICO_API_AND_EVENT_ARCHITECTURE.md**
   - Domain-organized REST API design
   - Event-driven workflow details
   - Critical endpoint: Session Completion
   - Background job specifications
   - Notification trigger system
   - Admin operations API
   - Error handling & resilience patterns
   - Monitoring & observability strategy

### Integration Points

These documents integrate with:
- `prisma/schema.prisma` - Database schema (UPDATED)
- Future: API handler code (in `/src/app/api/`)
- Future: Queue consumer code (in `/src/workers/`)
- Future: Background job code (in `/src/jobs/`)

---

## 🚀 Implementation Roadmap

### Phase 1: Foundations (Weeks 1-2)
- [ ] Run `prisma migrate dev` to validate schema
- [ ] Create database migration file
- [ ] Implement core session endpoints
- [ ] Set up message queue (Redis/RabbitMQ)
- [ ] Create event handlers skeleton

**Deliverable**: Basic session lifecycle working

### Phase 2: Progress & Payments (Weeks 3-4)
- [ ] Implement ProgressUpdate submission
- [ ] Wire up MetricsUpdateHandler
- [ ] Create OrgRevenue recording
- [ ] Implement CoachEarning calculation
- [ ] Create CoachWallet & CoachPayout endpoints

**Deliverable**: Complete payment flow working

### Phase 3: Recommendations & Reports (Weeks 5-6)
- [ ] Implement RecommendationEngine
- [ ] Wire up recommendation triggers
- [ ] Create report generation (PlayerReport, CoachReport, etc.)
- [ ] Build recommendation acknowledgment UI
- [ ] Implement weekly analysis job

**Deliverable**: Insights & reporting system live

### Phase 4: Scale & Polish (Weeks 7+)
- [ ] Notification system fully working (SMS, push, email)
- [ ] Admin dashboard complete
- [ ] Analytics aggregation optimized
- [ ] Performance testing & optimization
- [ ] Security audit & hardening

**Deliverable**: Production-ready system

---

## ✅ Pre-Implementation Checklist

Before starting development:

- [ ] **Schema validated**: Run `prisma validate` to ensure no syntax errors
- [ ] **Migration created**: Generate migration file for schema changes
- [ ] **Team alignment**: All stakeholders reviewed architecture docs
- [ ] **Database**: PostgreSQL 14+ instance ready
- [ ] **Queue setup**: Redis or RabbitMQ ready for events
- [ ] **Auth**: JWT/session system designed
- [ ] **Testing**: Test database & staging environment
- [ ] **Monitoring**: Logging & alerting infrastructure ready

---

## 🛠️ Technical Decisions

### Database
- **PostgreSQL**: Relational with strong consistency
- **Prisma ORM**: Type-safe, migration management
- **Indexes**: Created on common query patterns

### Event Processing
- **Message Queue**: Redis Streams or RabbitMQ (decide based on ops)
- **Retry Logic**: Exponential backoff with max 3 retries
- **Dead Letter Queue**: For manual review of failed events

### Notifications
- **SMS**: M-Pesa integration first (Kenya market)
- **Push**: Firebase Cloud Messaging
- **Email**: SendGrid or similar

### Reporting
- **Generation**: Scheduled daily at 8 AM UTC
- **Storage**: Separate reporting tables for easy querying
- **Caching**: 24-hour cache for analytics

### Admin Operations
- **Dashboard**: Real-time updates via WebSockets
- **Payout**: Weekly processing, manual trigger available
- **Audit**: All admin actions logged with timestamp & user

---

## 🎯 Success Metrics

Track these to ensure architecture is working:

1. **Session Completion Pipeline**
   - Time from "mark complete" → all events processed: < 10 seconds
   - Success rate: 99%+

2. **Progress Tracking**
   - MetricHistory records created: 100% of completed sessions
   - Recommendations triggered correctly: 95%+ accuracy

3. **Financial Accuracy**
   - OrgRevenue recorded: 100% of session prices
   - Coach earnings calculated: 100% correctly
   - Payout reconciliation: 100% match

4. **Notification Delivery**
   - SMS delivery: 98%+ within 1 minute
   - Push notifications: 95%+ delivered
   - Email: 95%+ within 5 minutes

5. **System Reliability**
   - API uptime: 99.9%+
   - Queue processing: < 5 minute lag
   - Database query performance: < 100ms for user queries

---

## 🔐 Security Considerations

### Data Protection
- Passwords hashed (bcrypt)
- Payment data never stored in app (PCI compliance)
- Sensitive logs redacted
- GDPR-compliant data deletion

### API Security
- All endpoints require JWT auth
- Role-based access control enforced
- Rate limiting per user & organization
- SQL injection prevention (Prisma ORM)
- CSRF protection for web endpoints

### Financial Security
- Audit trail for all payments
- Coach bank details encrypted
- M-Pesa API credentials secured
- Double-entry accounting for reconciliation

---

## 📞 Questions & Clarifications

### For Future Sessions

1. **Notification Preferences**: Should parents be able to opt-out of certain notifications?
2. **Metric Customization**: Can organizations define custom metrics beyond the 8 core ones?
3. **Payout Minimum**: What's the minimum payout amount before processing?
4. **Report Retention**: How long should historical reports be kept?
5. **Currency**: Multi-currency support or Kenya-only initially?
6. **Scaling**: Expected growth rate? This affects infrastructure choices.

---

## 🚦 Next Steps

1. **Immediate**: Review this architecture with stakeholders
2. **This week**: Validate schema with `prisma validate`
3. **This week**: Create database migration
4. **Next week**: Start Phase 1 implementation
5. **Daily**: Reference architecture docs for guidance

---

## 📖 How to Use These Documents

### For Developers
1. Start with **VICO_OPERATING_MODEL_ARCHITECTURE.md** to understand the vision
2. Reference **VICO_SCHEMA_REVIEW_AGAINST_ARCHITECTURE.md** for data model details
3. Use **VICO_API_AND_EVENT_ARCHITECTURE.md** for API implementation

### For Product/Design
1. Focus on **VICO_OPERATING_MODEL_ARCHITECTURE.md** sections 3-6 (Progress, Reports, Recommendations)
2. Reference reporting section for UI requirements
3. Use admin panel section for dashboard wireframes

### For DevOps/Infrastructure
1. Review event queue section in API architecture
2. Set up monitoring as specified
3. Configure notifications infrastructure

---

## 🎬 Final Notes

This architecture is **comprehensive, locked, and ready for implementation**. It represents a complete vision for Vico as a data-driven tennis coaching platform where:

- **Organizations** control the money and relationships
- **Sessions** are the currency of progress
- **Data** flows into insights
- **Insights** drive better decisions
- **Decisions** lead to measurable outcomes

The system is designed to be:
- **Scalable**: From single coach to multi-org networks
- **Reliable**: Event-driven with retry logic
- **Transparent**: Clear financial tracking
- **Insightful**: Data-driven recommendations
- **User-friendly**: Role-specific experiences

**Start building. The architecture will guide you.**

---

**Architecture Version**: 1.0  
**Last Updated**: April 29, 2026  
**Status**: 🔒 LOCKED - Ready for Development  
**Maintainer**: Development Team  

---

## 📚 All Documentation Files

1. [VICO_OPERATING_MODEL_ARCHITECTURE.md](VICO_OPERATING_MODEL_ARCHITECTURE.md) - 14 key systems
2. [VICO_SCHEMA_REVIEW_AGAINST_ARCHITECTURE.md](VICO_SCHEMA_REVIEW_AGAINST_ARCHITECTURE.md) - Schema alignment
3. [VICO_API_AND_EVENT_ARCHITECTURE.md](VICO_API_AND_EVENT_ARCHITECTURE.md) - API design & events
4. **THIS FILE** - Implementation summary & checklist

