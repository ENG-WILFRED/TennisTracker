-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isDeveloper" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "photo" TEXT,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "bio" TEXT,
    "profileComplete" BOOLEAN NOT NULL DEFAULT true,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Kenya',
    "acceptedTermsAt" TIMESTAMP(3),
    "termsDeclineCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipInvitation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "dependentId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "ratingPoints" INTEGER NOT NULL DEFAULT 1500,
    "winRate" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isClub" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT,
    "condition" TEXT,
    "location" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "clubId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referee" (
    "matchesRefereed" INTEGER NOT NULL DEFAULT 0,
    "ballCrewMatches" INTEGER NOT NULL DEFAULT 0,
    "experience" TEXT,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Referee_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Staff" (
    "role" TEXT NOT NULL,
    "expertise" TEXT,
    "contact" TEXT,
    "employedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "yearsOfExperience" INTEGER DEFAULT 0,
    "coachingLevel" TEXT,
    "formerPlayerBackground" TEXT,
    "playerAgeGroups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillLevelsTrained" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trainingTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languagesSpoken" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sessionDurations" INTEGER[] DEFAULT ARRAY[30, 60, 90]::INTEGER[],
    "maxStudentsPerSession" INTEGER DEFAULT 1,
    "courtLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "coachingPhilosophy" TEXT,
    "achievements" TEXT,
    "introVideoUrl" TEXT,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "organizationId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Spectator" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spectator_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT,
    "createdBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activityScore" INTEGER NOT NULL DEFAULT 0,
    "playerDevScore" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "tournamentEngScore" INTEGER NOT NULL DEFAULT 0,
    "verifiedBadge" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phone" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "organizationId" TEXT,
    "tournamentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'internal',
    "contextType" TEXT NOT NULL DEFAULT 'both',
    "price" DOUBLE PRECISION,
    "location" TEXT,
    "externalLink" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "providerId" TEXT,
    "contextType" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialization" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "yearsOfFocus" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachPricing" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "pricePerSession" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "package3Sessions" DOUBLE PRECISION,
    "package10Sessions" DOUBLE PRECISION,
    "juniorDiscount" DOUBLE PRECISION DEFAULT 0,
    "groupSessionDiscount" DOUBLE PRECISION DEFAULT 0,
    "commissionRate" DOUBLE PRECISION DEFAULT 0,
    "paymentMethods" TEXT[] DEFAULT ARRAY['credit_card', 'bank_transfer']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachReview" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "field" TEXT,
    "newValue" TEXT,
    "oldValue" TEXT,
    "performedBy" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateScanLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "staffId" TEXT,
    "name" TEXT NOT NULL,
    "scanType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scannerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GateScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityIncident" (
    "id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reportedById" TEXT,
    "organizationId" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "playerAId" TEXT NOT NULL,
    "playerBId" TEXT NOT NULL,
    "refereeId" TEXT,
    "winnerId" TEXT,
    "score" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "group" TEXT,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchReport" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "pdfContent" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchBallCrew" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "refereeId" TEXT,

    CONSTRAINT "MatchBallCrew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerBadge" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformancePoint" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformancePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TennisRule" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TennisRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDM" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "replyToId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Court" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courtNumber" INTEGER NOT NULL,
    "surface" TEXT NOT NULL,
    "indoorOutdoor" TEXT NOT NULL DEFAULT 'outdoor',
    "lights" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'available',
    "maintenedUntil" TIMESTAMP(3),
    "description" TEXT,
    "imageUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "width" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "maxCapacity" INTEGER,
    "peakHourStart" TEXT,
    "peakHourEnd" TEXT,
    "peakPrice" DOUBLE PRECISION,
    "offPeakPrice" DOUBLE PRECISION,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availableDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openTime" TEXT,
    "closeTime" TEXT,
    "nextMaintenanceDate" TIMESTAMP(3),
    "lastInspectionDate" TIMESTAMP(3),
    "yearBuilt" INTEGER,
    "renovationYear" INTEGER,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Court_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtImage" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "posX" DOUBLE PRECISION DEFAULT 0,
    "posY" DOUBLE PRECISION DEFAULT 0,
    "scale" DOUBLE PRECISION DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtBooking" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "memberId" TEXT,
    "playerName" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "bookingType" TEXT NOT NULL DEFAULT 'regular',
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "price" DOUBLE PRECISION,
    "isPeak" BOOLEAN NOT NULL DEFAULT false,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "notes" TEXT DEFAULT 'No additional notes',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtComment" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "bookingId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtComplaint" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "bookingId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolvedNotes" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipTier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "benefitsJson" TEXT,
    "courtHoursPerMonth" INTEGER,
    "maxConcurrentBookings" INTEGER DEFAULT 3,
    "discountPercentage" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "tierId" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "paymentStatus" TEXT NOT NULL DEFAULT 'active',
    "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendanceCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttendance" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'member',
    "suspensionReason" TEXT,
    "suspendedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRanking" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "currentRank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "ratingPoints" INTEGER NOT NULL,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingChallenge" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "challengeDate" TIMESTAMP(3) NOT NULL,
    "matchDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isFormal" BOOLEAN NOT NULL DEFAULT false,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankingChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "registrationCap" INTEGER NOT NULL DEFAULT 64,
    "registrationDeadline" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "prizePool" DOUBLE PRECISION,
    "entryFee" DOUBLE PRECISION,
    "rules" TEXT,
    "instructions" TEXT,
    "eatingAreas" TEXT,
    "sleepingAreas" TEXT,
    "courtInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "signupOrder" INTEGER NOT NULL,
    "rejectionReason" TEXT,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventWaitlist" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentBracket" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bracketType" TEXT NOT NULL DEFAULT 'single_elimination',
    "totalRounds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentBracket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bracketId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchPosition" INTEGER NOT NULL,
    "playerAId" TEXT,
    "playerBId" TEXT,
    "scoreSetA" TEXT,
    "scoreSetB" TEXT,
    "scoreSetC" TEXT,
    "winnerId" TEXT,
    "servingPlayerId" TEXT,
    "lastResetReason" TEXT,
    "lastResetAt" TIMESTAMP(3),
    "scheduledTime" TIMESTAMP(3),
    "courtId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultSubmittedAt" TIMESTAMP(3),
    "resultSubmittedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubAnnouncement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "announcementType" TEXT NOT NULL DEFAULT 'general',
    "targetRoles" TEXT[] DEFAULT ARRAY['member']::TEXT[],
    "createdBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentAnnouncement" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "announcementType" TEXT NOT NULL DEFAULT 'general',
    "createdBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventReminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "remindTime" TIMESTAMP(3),
    "reminderType" TEXT NOT NULL DEFAULT 'email',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL DEFAULT 'payment',
    "message" TEXT,
    "sentAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubFinance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "membershipRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "courtBookingRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coachCommissions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eventRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubFinance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceTransaction" (
    "id" TEXT NOT NULL,
    "financeId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transactionType" TEXT NOT NULL DEFAULT 'credit',
    "memberId" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "bookingType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerStatus" TEXT NOT NULL DEFAULT 'pending',
    "providerTransactionId" TEXT,
    "checkoutUrl" TEXT,
    "callbackUrl" TEXT,
    "cancelUrl" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationRole" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationBadge" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "badgeName" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL DEFAULT 'custom',
    "achievementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubRating" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "ratedBy" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" TEXT DEFAULT 'public',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'post',
    "tournamentId" TEXT,
    "organizationId" TEXT,
    "shareCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentCommentId" TEXT,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentComment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentCommentId" TEXT,

    CONSTRAINT "TournamentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentCommentReaction" (
    "id" TEXT NOT NULL,
    "tournamentCommentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentCommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollower" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAmenity" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER,
    "price" DOUBLE PRECISION,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmenityBooking" (
    "id" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "memberId" TEXT,
    "guestName" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "price" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmenityBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationActivity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleAppeal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ruleCategory" TEXT,
    "ruleLabel" TEXT,
    "appealText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "responseText" TEXT,
    "respondedBy" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTask" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "serviceId" TEXT,
    "staffUserId" TEXT,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "role" TEXT NOT NULL,
    "responsibility" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "rejectionReason" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachSession" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "organizationId" TEXT,
    "playerId" TEXT,
    "recurringSessionId" TEXT,
    "sessionType" TEXT NOT NULL DEFAULT '1-on-1',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "courtId" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION,
    "durationMinutes" INTEGER,
    "coachCompletedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionBooking" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attendanceStatus" TEXT DEFAULT 'pending',
    "notes" TEXT,
    "feedbackRating" DOUBLE PRECISION DEFAULT 0,
    "feedbackText" TEXT,
    "playerConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SessionBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgCoachingPricing" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "minSessionDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "roundingType" TEXT NOT NULL DEFAULT 'up',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgCoachingPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierCoachingPrice" (
    "id" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,
    "tierName" TEXT NOT NULL,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "discountPercent" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TierCoachingPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachSpecificPrice" (
    "id" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "tierName" TEXT,
    "description" TEXT,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachSpecificPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPayment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "playerTier" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "durationHours" DECIMAL(5,2) NOT NULL,
    "pricePerHour" DECIMAL(10,2) NOT NULL,
    "pricingRuleType" TEXT,
    "tierPriceId" TEXT,
    "coachPriceId" TEXT,
    "coachEarnings" DECIMAL(10,2) NOT NULL,
    "coachCommissionRate" DECIMAL(3,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "chargedAt" TIMESTAMP(3),
    "paidToCoachAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrgDebt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstandingAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "dueDate" TIMESTAMP(3),
    "lastPaymentAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOrgDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtTransaction" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachWallet" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWithdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachPayout" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL,
    "bankDetails" TEXT,
    "transactionRef" TEXT,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CoachPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachPlayerRelationship" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSessionAt" TIMESTAMP(3),
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachPlayerRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachPlayerNote" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachPlayerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachStats" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "totalPlayers" INTEGER NOT NULL DEFAULT 0,
    "activePlayers" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancellationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachDailyStats" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "newPlayers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachSessionReview" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachSessionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachPlayerRating" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sessionId" TEXT,
    "overallRating" DOUBLE PRECISION NOT NULL,
    "techniquRating" DOUBLE PRECISION,
    "mentalRating" DOUBLE PRECISION,
    "fitnessRating" DOUBLE PRECISION,
    "teamworkRating" DOUBLE PRECISION,
    "strengths" TEXT,
    "areasForImprovement" TEXT,
    "notes" TEXT,
    "sessionType" TEXT,
    "trainingFocus" TEXT,
    "isConcluded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachPlayerRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "placeholder" TEXT,
    "helpText" TEXT,
    "options" JSONB,
    "validation" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "role" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isFormBased" BOOLEAN NOT NULL DEFAULT false,
    "formSchema" JSONB,
    "contextFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instructions" TEXT,
    "estimatedHours" DOUBLE PRECISION,
    "successCriteria" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "statusHistory" JSONB NOT NULL DEFAULT '[]',
    "context" JSONB NOT NULL,
    "dueDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceRequest" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedByUserId" TEXT,
    "approvalNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSubmission" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "pdfFileName" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskHistory" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetOtp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "pageUrl" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerMetric" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serve" INTEGER NOT NULL DEFAULT 50,
    "forehand" INTEGER NOT NULL DEFAULT 50,
    "backhand" INTEGER NOT NULL DEFAULT 50,
    "movement" INTEGER NOT NULL DEFAULT 50,
    "stamina" INTEGER NOT NULL DEFAULT 50,
    "strategy" INTEGER NOT NULL DEFAULT 50,
    "mentalToughness" INTEGER NOT NULL DEFAULT 50,
    "courtAwareness" INTEGER NOT NULL DEFAULT 50,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricHistory" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "serve" INTEGER NOT NULL,
    "forehand" INTEGER NOT NULL,
    "backhand" INTEGER NOT NULL,
    "movement" INTEGER NOT NULL,
    "stamina" INTEGER NOT NULL,
    "strategy" INTEGER NOT NULL,
    "mentalToughness" INTEGER NOT NULL,
    "courtAwareness" INTEGER NOT NULL,
    "changes" JSONB NOT NULL,
    "trend" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressUpdate" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ratingChanges" JSONB NOT NULL,
    "focusAreas" TEXT[],
    "notes" TEXT,
    "overallProgress" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "triggerData" JSONB,
    "actionItems" TEXT[],
    "linkedSessionId" TEXT,
    "linkedMatchId" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgRevenue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentType" TEXT NOT NULL,
    "fromPlayerId" TEXT,
    "fromParentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sessionIds" TEXT[],
    "subscriptionId" TEXT,
    "invoiceId" TEXT,
    "mpesaTransactionId" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachEarning" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sessionPrice" DECIMAL(10,2) NOT NULL,
    "coachPercentage" DECIMAL(3,2) NOT NULL DEFAULT 0.60,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "payoutCycleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachPayoutCycle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cycleNumber" TEXT NOT NULL,
    "cycleType" TEXT NOT NULL,
    "payoutDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "earningIds" TEXT[],
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachPayoutCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachAvailability" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxSessionsPerDay" INTEGER NOT NULL DEFAULT 6,
    "sessionDuration" INTEGER NOT NULL DEFAULT 60,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "recurringUntil" TIMESTAMP(3),
    "blackoutDates" TIMESTAMP(3)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "sessionId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "action" TEXT,
    "actionUrl" TEXT,
    "deliveryChannels" TEXT[],
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "playerAttendance" JSONB NOT NULL,
    "whatWasWorked" TEXT[],
    "focusAreasNext" TEXT[],
    "coachNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerReport" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metricsSnapshot" JSONB NOT NULL,
    "improvementScore" INTEGER NOT NULL DEFAULT 0,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "coachNotes" TEXT,
    "focusAreas" TEXT[],
    "recommendedNextSteps" TEXT[],
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentReport" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "improvementSummary" TEXT NOT NULL,
    "sessionSummary" TEXT NOT NULL,
    "achievements" TEXT[],
    "recommendations" TEXT[],
    "sessionsEnrolled" INTEGER NOT NULL,
    "totalPaid" DECIMAL(10,2) NOT NULL,
    "nextPaymentDue" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachReport" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "playersManaged" INTEGER NOT NULL DEFAULT 0,
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "sessionsScheduled" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgPlayerRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "playersImproving" INTEGER NOT NULL DEFAULT 0,
    "playersStagnating" INTEGER NOT NULL DEFAULT 0,
    "earningsThisPeriod" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pendingEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payoutSchedule" TEXT,
    "playerFeedback" TEXT[],
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgAnalytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "revenueByType" JSONB NOT NULL,
    "activePlayersCount" INTEGER NOT NULL DEFAULT 0,
    "newPlayersCount" INTEGER NOT NULL DEFAULT 0,
    "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churnedPlayersCount" INTEGER NOT NULL DEFAULT 0,
    "activeCoachesCount" INTEGER NOT NULL DEFAULT 0,
    "totalCoachEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avgCoachRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSessionRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionsByType" JSONB NOT NULL,
    "courtUtilization" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "peakHours" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "lineItems" JSONB NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mpesaBusinessCode" TEXT,
    "mpesaAccountCode" TEXT,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "bankName" TEXT,
    "swiftCode" TEXT,
    "stripeAccountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sessionsPerPeriod" INTEGER NOT NULL,
    "pricePerPeriod" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTrigger" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "triggerCondition" JSONB,
    "notifyTo" TEXT[],
    "channels" TEXT[],
    "messageTemplate" TEXT NOT NULL,
    "titleTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "retryCount" INTEGER NOT NULL DEFAULT 3,
    "retryDelayMinutes" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'published',
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "processingRecords" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceModel" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "parentId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "lineItems" JSONB NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "debitAccount" TEXT,
    "creditAccount" TEXT,
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "gateway" TEXT NOT NULL,
    "transactionId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricWeight" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "playerLevel" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeTo" TIMESTAMP(3),

    CONSTRAINT "MetricWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "maxActivePerPlayer" INTEGER NOT NULL DEFAULT 3,
    "maxPerWeek" INTEGER NOT NULL DEFAULT 2,
    "confidenceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "showLowConfidence" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pattern" TEXT NOT NULL,
    "daysOfWeek" INTEGER[],
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "maxParticipants" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnershipTransfer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'dependent',
    "transferDate" TIMESTAMP(3),
    "reason" TEXT,
    "initiatedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnershipTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLogModel" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "eventId" TEXT,
    "correlationId" TEXT,
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationLogModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPlayerStats" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sessionsAttended" INTEGER NOT NULL DEFAULT 0,
    "sessionsMissed" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION,
    "metricScores" JSONB,
    "milestonesReached" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachPerformanceSummary" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "playersManaged" INTEGER NOT NULL DEFAULT 0,
    "avgSessionRating" DOUBLE PRECISION,
    "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pendingPayout" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachPerformanceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgMetricsSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "totalRevenue" DECIMAL(12,2) NOT NULL,
    "monthlyRecurring" DECIMAL(12,2) NOT NULL,
    "activePlayersCount" INTEGER NOT NULL,
    "newThisMonth" INTEGER NOT NULL,
    "churnedThisMonth" INTEGER NOT NULL,
    "activeCoachesCount" INTEGER NOT NULL,
    "avgCoachRating" DOUBLE PRECISION,
    "totalCoachEarnings" DECIMAL(12,2) NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL,
    "avgSessionRating" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgMetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "suiteName" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "testGroup" TEXT,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "message" TEXT,
    "error" TEXT,
    "output" TEXT,
    "requestsCompleted" INTEGER,
    "requestsFailed" INTEGER,
    "avgResponseTime" DOUBLE PRECISION,
    "minResponseTime" DOUBLE PRECISION,
    "maxResponseTime" DOUBLE PRECISION,
    "throughput" DOUBLE PRECISION,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "nodeVersion" TEXT,
    "appVersion" TEXT,
    "testRunId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "runType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "failedTests" INTEGER NOT NULL DEFAULT 0,
    "skippedTests" INTEGER NOT NULL DEFAULT 0,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "nodeVersion" TEXT,
    "appVersion" TEXT,
    "triggeredBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeedLog" (
    "id" TEXT NOT NULL,
    "seedName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeedLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperEmailLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "installationFee" INTEGER NOT NULL,
    "monthlySubscription" INTEGER NOT NULL,
    "sentBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationPayment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_latitude_longitude_idx" ON "User"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "User_city_idx" ON "User"("city");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_orgId_idx" ON "Membership"("orgId");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_orgId_role_key" ON "Membership"("userId", "orgId", "role");

-- CreateIndex
CREATE INDEX "MembershipInvitation_orgId_idx" ON "MembershipInvitation"("orgId");

-- CreateIndex
CREATE INDEX "MembershipInvitation_email_idx" ON "MembershipInvitation"("email");

-- CreateIndex
CREATE INDEX "MembershipInvitation_status_idx" ON "MembershipInvitation"("status");

-- CreateIndex
CREATE INDEX "MembershipInvitation_expiresAt_idx" ON "MembershipInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipInvitation_orgId_email_role_key" ON "MembershipInvitation"("orgId", "email", "role");

-- CreateIndex
CREATE INDEX "Guardian_guardianId_idx" ON "Guardian"("guardianId");

-- CreateIndex
CREATE INDEX "Guardian_dependentId_idx" ON "Guardian"("dependentId");

-- CreateIndex
CREATE INDEX "Guardian_isApproved_idx" ON "Guardian"("isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_guardianId_dependentId_key" ON "Guardian"("guardianId", "dependentId");

-- CreateIndex
CREATE INDEX "Player_createdAt_idx" ON "Player"("createdAt");

-- CreateIndex
CREATE INDEX "Player_organizationId_idx" ON "Player"("organizationId");

-- CreateIndex
CREATE INDEX "InventoryItem_organizationId_idx" ON "InventoryItem"("organizationId");

-- CreateIndex
CREATE INDEX "InventoryItem_updatedAt_idx" ON "InventoryItem"("updatedAt");

-- CreateIndex
CREATE INDEX "Staff_organizationId_idx" ON "Staff"("organizationId");

-- CreateIndex
CREATE INDEX "Staff_employedById_idx" ON "Staff"("employedById");

-- CreateIndex
CREATE INDEX "Staff_isActive_idx" ON "Staff"("isActive");

-- CreateIndex
CREATE INDEX "Staff_createdAt_idx" ON "Staff"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_createdAt_idx" ON "Organization"("createdAt");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_userId_key" ON "ProviderProfile"("userId");

-- CreateIndex
CREATE INDEX "ProviderProfile_organizationId_idx" ON "ProviderProfile"("organizationId");

-- CreateIndex
CREATE INDEX "Service_providerId_idx" ON "Service"("providerId");

-- CreateIndex
CREATE INDEX "Service_organizationId_idx" ON "Service"("organizationId");

-- CreateIndex
CREATE INDEX "Service_tournamentId_idx" ON "Service"("tournamentId");

-- CreateIndex
CREATE INDEX "ServiceBooking_userId_idx" ON "ServiceBooking"("userId");

-- CreateIndex
CREATE INDEX "ServiceBooking_serviceId_idx" ON "ServiceBooking"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceBooking_providerId_idx" ON "ServiceBooking"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_staffId_name_key" ON "Certification"("staffId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Specialization_staffId_name_key" ON "Specialization"("staffId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_staffId_dayOfWeek_startTime_key" ON "Availability"("staffId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "CoachPricing_staffId_key" ON "CoachPricing"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachReview_staffId_playerId_key" ON "CoachReview"("staffId", "playerId");

-- CreateIndex
CREATE INDEX "GateScanLog_userId_idx" ON "GateScanLog"("userId");

-- CreateIndex
CREATE INDEX "GateScanLog_staffId_idx" ON "GateScanLog"("staffId");

-- CreateIndex
CREATE INDEX "GateScanLog_scannerId_idx" ON "GateScanLog"("scannerId");

-- CreateIndex
CREATE INDEX "GateScanLog_organizationId_idx" ON "GateScanLog"("organizationId");

-- CreateIndex
CREATE INDEX "GateScanLog_scanType_idx" ON "GateScanLog"("scanType");

-- CreateIndex
CREATE INDEX "GateScanLog_scannedAt_idx" ON "GateScanLog"("scannedAt");

-- CreateIndex
CREATE INDEX "SecurityIncident_reportedById_idx" ON "SecurityIncident"("reportedById");

-- CreateIndex
CREATE INDEX "SecurityIncident_organizationId_idx" ON "SecurityIncident"("organizationId");

-- CreateIndex
CREATE INDEX "SecurityIncident_severity_idx" ON "SecurityIncident"("severity");

-- CreateIndex
CREATE INDEX "SecurityIncident_status_idx" ON "SecurityIncident"("status");

-- CreateIndex
CREATE INDEX "SecurityIncident_reportedAt_idx" ON "SecurityIncident"("reportedAt");

-- CreateIndex
CREATE INDEX "Match_refereeId_idx" ON "Match"("refereeId");

-- CreateIndex
CREATE INDEX "Match_winnerId_idx" ON "Match"("winnerId");

-- CreateIndex
CREATE INDEX "Match_createdAt_idx" ON "Match"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchReport_matchId_key" ON "MatchReport"("matchId");

-- CreateIndex
CREATE INDEX "MatchReport_matchId_idx" ON "MatchReport"("matchId");

-- CreateIndex
CREATE INDEX "MatchReport_refereeId_idx" ON "MatchReport"("refereeId");

-- CreateIndex
CREATE INDEX "MatchReport_generatedAt_idx" ON "MatchReport"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TennisRule_category_label_key" ON "TennisRule"("category", "label");

-- CreateIndex
CREATE INDEX "ChatRoom_isDM_idx" ON "ChatRoom"("isDM");

-- CreateIndex
CREATE INDEX "ChatRoom_createdAt_idx" ON "ChatRoom"("createdAt");

-- CreateIndex
CREATE INDEX "ChatRoom_updatedAt_idx" ON "ChatRoom"("updatedAt");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_playerId_emoji_key" ON "MessageReaction"("messageId", "playerId", "emoji");

-- CreateIndex
CREATE INDEX "ChatParticipant_roomId_idx" ON "ChatParticipant"("roomId");

-- CreateIndex
CREATE INDEX "ChatParticipant_playerId_idx" ON "ChatParticipant"("playerId");

-- CreateIndex
CREATE INDEX "ChatParticipant_isOnline_idx" ON "ChatParticipant"("isOnline");

-- CreateIndex
CREATE INDEX "ChatParticipant_playerId_lastSeen_idx" ON "ChatParticipant"("playerId", "lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_roomId_playerId_key" ON "ChatParticipant"("roomId", "playerId");

-- CreateIndex
CREATE INDEX "Court_organizationId_idx" ON "Court"("organizationId");

-- CreateIndex
CREATE INDEX "Court_status_idx" ON "Court"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Court_organizationId_courtNumber_key" ON "Court"("organizationId", "courtNumber");

-- CreateIndex
CREATE INDEX "CourtImage_courtId_idx" ON "CourtImage"("courtId");

-- CreateIndex
CREATE INDEX "CourtImage_order_courtId_idx" ON "CourtImage"("order", "courtId");

-- CreateIndex
CREATE INDEX "CourtBooking_organizationId_startTime_endTime_idx" ON "CourtBooking"("organizationId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "CourtBooking_status_idx" ON "CourtBooking"("status");

-- CreateIndex
CREATE INDEX "CourtBooking_courtId_startTime_idx" ON "CourtBooking"("courtId", "startTime");

-- CreateIndex
CREATE INDEX "CourtBooking_createdAt_idx" ON "CourtBooking"("createdAt");

-- CreateIndex
CREATE INDEX "CourtComment_courtId_idx" ON "CourtComment"("courtId");

-- CreateIndex
CREATE INDEX "CourtComment_bookingId_idx" ON "CourtComment"("bookingId");

-- CreateIndex
CREATE INDEX "CourtComment_authorId_idx" ON "CourtComment"("authorId");

-- CreateIndex
CREATE INDEX "CourtComment_createdAt_idx" ON "CourtComment"("createdAt");

-- CreateIndex
CREATE INDEX "CourtComplaint_courtId_idx" ON "CourtComplaint"("courtId");

-- CreateIndex
CREATE INDEX "CourtComplaint_bookingId_idx" ON "CourtComplaint"("bookingId");

-- CreateIndex
CREATE INDEX "CourtComplaint_authorId_idx" ON "CourtComplaint"("authorId");

-- CreateIndex
CREATE INDEX "CourtComplaint_status_idx" ON "CourtComplaint"("status");

-- CreateIndex
CREATE INDEX "CourtComplaint_createdAt_idx" ON "CourtComplaint"("createdAt");

-- CreateIndex
CREATE INDEX "CourtComplaint_courtId_status_idx" ON "CourtComplaint"("courtId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipTier_name_key" ON "MembershipTier"("name");

-- CreateIndex
CREATE INDEX "ClubMember_organizationId_idx" ON "ClubMember"("organizationId");

-- CreateIndex
CREATE INDEX "ClubMember_playerId_idx" ON "ClubMember"("playerId");

-- CreateIndex
CREATE INDEX "ClubMember_createdAt_idx" ON "ClubMember"("createdAt");

-- CreateIndex
CREATE INDEX "ClubMember_paymentStatus_idx" ON "ClubMember"("paymentStatus");

-- CreateIndex
CREATE INDEX "ClubMember_organizationId_paymentStatus_idx" ON "ClubMember"("organizationId", "paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_organizationId_playerId_role_key" ON "ClubMember"("organizationId", "playerId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRanking_organizationId_memberId_weekNumber_year_key" ON "PlayerRanking"("organizationId", "memberId", "weekNumber", "year");

-- CreateIndex
CREATE INDEX "ClubEvent_organizationId_idx" ON "ClubEvent"("organizationId");

-- CreateIndex
CREATE INDEX "ClubEvent_startDate_endDate_idx" ON "ClubEvent"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "ClubEvent_createdAt_idx" ON "ClubEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_memberId_key" ON "EventRegistration"("eventId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "EventWaitlist_eventId_memberId_key" ON "EventWaitlist"("eventId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentBracket_eventId_key" ON "TournamentBracket"("eventId");

-- CreateIndex
CREATE INDEX "TournamentMatch_round_idx" ON "TournamentMatch"("round");

-- CreateIndex
CREATE INDEX "TournamentMatch_playerAId_idx" ON "TournamentMatch"("playerAId");

-- CreateIndex
CREATE INDEX "TournamentMatch_playerBId_idx" ON "TournamentMatch"("playerBId");

-- CreateIndex
CREATE INDEX "TournamentMatch_winnerId_idx" ON "TournamentMatch"("winnerId");

-- CreateIndex
CREATE INDEX "TournamentMatch_scheduledTime_idx" ON "TournamentMatch"("scheduledTime");

-- CreateIndex
CREATE INDEX "TournamentAnnouncement_eventId_idx" ON "TournamentAnnouncement"("eventId");

-- CreateIndex
CREATE INDEX "TournamentAnnouncement_organizationId_idx" ON "TournamentAnnouncement"("organizationId");

-- CreateIndex
CREATE INDEX "TournamentAnnouncement_createdAt_idx" ON "TournamentAnnouncement"("createdAt");

-- CreateIndex
CREATE INDEX "EventReminder_eventId_idx" ON "EventReminder"("eventId");

-- CreateIndex
CREATE INDEX "PaymentReminder_eventId_idx" ON "PaymentReminder"("eventId");

-- CreateIndex
CREATE INDEX "PaymentReminder_memberId_idx" ON "PaymentReminder"("memberId");

-- CreateIndex
CREATE INDEX "PaymentReminder_isRead_idx" ON "PaymentReminder"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "ClubFinance_organizationId_month_year_key" ON "ClubFinance"("organizationId", "month", "year");

-- CreateIndex
CREATE INDEX "PaymentRecord_userId_idx" ON "PaymentRecord"("userId");

-- CreateIndex
CREATE INDEX "PaymentRecord_eventId_idx" ON "PaymentRecord"("eventId");

-- CreateIndex
CREATE INDEX "PaymentRecord_providerStatus_idx" ON "PaymentRecord"("providerStatus");

-- CreateIndex
CREATE INDEX "PaymentRecord_callbackUrl_idx" ON "PaymentRecord"("callbackUrl");

-- CreateIndex
CREATE INDEX "PaymentRecord_cancelUrl_idx" ON "PaymentRecord"("cancelUrl");

-- CreateIndex
CREATE INDEX "PaymentRecord_createdAt_idx" ON "PaymentRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationRole_organizationId_name_key" ON "OrganizationRole"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionName_key" ON "RolePermission"("roleId", "permissionName");

-- CreateIndex
CREATE INDEX "OrganizationBadge_organizationId_idx" ON "OrganizationBadge"("organizationId");

-- CreateIndex
CREATE INDEX "ClubRating_organizationId_idx" ON "ClubRating"("organizationId");

-- CreateIndex
CREATE INDEX "ClubRating_ratedBy_idx" ON "ClubRating"("ratedBy");

-- CreateIndex
CREATE INDEX "ClubRating_createdAt_idx" ON "ClubRating"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");

-- CreateIndex
CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_tournamentId_idx" ON "CommunityPost"("tournamentId");

-- CreateIndex
CREATE INDEX "CommunityPost_organizationId_idx" ON "CommunityPost"("organizationId");

-- CreateIndex
CREATE INDEX "PostComment_postId_idx" ON "PostComment"("postId");

-- CreateIndex
CREATE INDEX "PostComment_authorId_idx" ON "PostComment"("authorId");

-- CreateIndex
CREATE INDEX "PostComment_parentCommentId_idx" ON "PostComment"("parentCommentId");

-- CreateIndex
CREATE INDEX "PostComment_createdAt_idx" ON "PostComment"("createdAt");

-- CreateIndex
CREATE INDEX "TournamentComment_eventId_idx" ON "TournamentComment"("eventId");

-- CreateIndex
CREATE INDEX "TournamentComment_authorId_idx" ON "TournamentComment"("authorId");

-- CreateIndex
CREATE INDEX "TournamentComment_parentCommentId_idx" ON "TournamentComment"("parentCommentId");

-- CreateIndex
CREATE INDEX "TournamentCommentReaction_tournamentCommentId_idx" ON "TournamentCommentReaction"("tournamentCommentId");

-- CreateIndex
CREATE INDEX "TournamentCommentReaction_userId_idx" ON "TournamentCommentReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentCommentReaction_tournamentCommentId_userId_key" ON "TournamentCommentReaction"("tournamentCommentId", "userId");

-- CreateIndex
CREATE INDEX "CommentReaction_commentId_idx" ON "CommentReaction"("commentId");

-- CreateIndex
CREATE INDEX "CommentReaction_userId_idx" ON "CommentReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReaction_commentId_userId_key" ON "CommentReaction"("commentId", "userId");

-- CreateIndex
CREATE INDEX "PostReaction_postId_idx" ON "PostReaction"("postId");

-- CreateIndex
CREATE INDEX "PostReaction_userId_idx" ON "PostReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_postId_userId_key" ON "PostReaction"("postId", "userId");

-- CreateIndex
CREATE INDEX "UserFollower_followerId_idx" ON "UserFollower"("followerId");

-- CreateIndex
CREATE INDEX "UserFollower_followingId_idx" ON "UserFollower"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollower_followerId_followingId_key" ON "UserFollower"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "EventAmenity_eventId_idx" ON "EventAmenity"("eventId");

-- CreateIndex
CREATE INDEX "AmenityBooking_amenityId_idx" ON "AmenityBooking"("amenityId");

-- CreateIndex
CREATE INDEX "AmenityBooking_memberId_idx" ON "AmenityBooking"("memberId");

-- CreateIndex
CREATE INDEX "OrganizationActivity_organizationId_createdAt_idx" ON "OrganizationActivity"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OrganizationActivity_playerId_idx" ON "OrganizationActivity"("playerId");

-- CreateIndex
CREATE INDEX "RuleAppeal_eventId_idx" ON "RuleAppeal"("eventId");

-- CreateIndex
CREATE INDEX "RuleAppeal_organizationId_idx" ON "RuleAppeal"("organizationId");

-- CreateIndex
CREATE INDEX "RuleAppeal_userId_idx" ON "RuleAppeal"("userId");

-- CreateIndex
CREATE INDEX "RuleAppeal_status_idx" ON "RuleAppeal"("status");

-- CreateIndex
CREATE INDEX "EventTask_eventId_idx" ON "EventTask"("eventId");

-- CreateIndex
CREATE INDEX "EventTask_organizationId_idx" ON "EventTask"("organizationId");

-- CreateIndex
CREATE INDEX "EventTask_serviceId_idx" ON "EventTask"("serviceId");

-- CreateIndex
CREATE INDEX "EventTask_staffUserId_idx" ON "EventTask"("staffUserId");

-- CreateIndex
CREATE INDEX "EventTask_status_idx" ON "EventTask"("status");

-- CreateIndex
CREATE INDEX "EventTask_createdAt_idx" ON "EventTask"("createdAt");

-- CreateIndex
CREATE INDEX "CoachSession_coachId_startTime_idx" ON "CoachSession"("coachId", "startTime");

-- CreateIndex
CREATE INDEX "CoachSession_organizationId_startTime_idx" ON "CoachSession"("organizationId", "startTime");

-- CreateIndex
CREATE INDEX "CoachSession_playerId_startTime_idx" ON "CoachSession"("playerId", "startTime");

-- CreateIndex
CREATE INDEX "CoachSession_recurringSessionId_idx" ON "CoachSession"("recurringSessionId");

-- CreateIndex
CREATE INDEX "CoachSession_status_idx" ON "CoachSession"("status");

-- CreateIndex
CREATE INDEX "CoachSession_createdAt_idx" ON "CoachSession"("createdAt");

-- CreateIndex
CREATE INDEX "SessionBooking_sessionId_idx" ON "SessionBooking"("sessionId");

-- CreateIndex
CREATE INDEX "SessionBooking_playerId_idx" ON "SessionBooking"("playerId");

-- CreateIndex
CREATE INDEX "SessionBooking_status_idx" ON "SessionBooking"("status");

-- CreateIndex
CREATE INDEX "SessionBooking_createdAt_idx" ON "SessionBooking"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionBooking_sessionId_playerId_key" ON "SessionBooking"("sessionId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgCoachingPricing_organizationId_key" ON "OrgCoachingPricing"("organizationId");

-- CreateIndex
CREATE INDEX "OrgCoachingPricing_organizationId_idx" ON "OrgCoachingPricing"("organizationId");

-- CreateIndex
CREATE INDEX "TierCoachingPrice_pricingId_idx" ON "TierCoachingPrice"("pricingId");

-- CreateIndex
CREATE INDEX "TierCoachingPrice_tierName_idx" ON "TierCoachingPrice"("tierName");

-- CreateIndex
CREATE UNIQUE INDEX "TierCoachingPrice_pricingId_tierName_key" ON "TierCoachingPrice"("pricingId", "tierName");

-- CreateIndex
CREATE INDEX "CoachSpecificPrice_pricingId_idx" ON "CoachSpecificPrice"("pricingId");

-- CreateIndex
CREATE INDEX "CoachSpecificPrice_coachId_idx" ON "CoachSpecificPrice"("coachId");

-- CreateIndex
CREATE INDEX "CoachSpecificPrice_isActive_idx" ON "CoachSpecificPrice"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CoachSpecificPrice_pricingId_coachId_tierName_key" ON "CoachSpecificPrice"("pricingId", "coachId", "tierName");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPayment_sessionId_key" ON "SessionPayment"("sessionId");

-- CreateIndex
CREATE INDEX "SessionPayment_organizationId_idx" ON "SessionPayment"("organizationId");

-- CreateIndex
CREATE INDEX "SessionPayment_playerId_idx" ON "SessionPayment"("playerId");

-- CreateIndex
CREATE INDEX "SessionPayment_coachId_idx" ON "SessionPayment"("coachId");

-- CreateIndex
CREATE INDEX "SessionPayment_status_idx" ON "SessionPayment"("status");

-- CreateIndex
CREATE INDEX "SessionPayment_createdAt_idx" ON "SessionPayment"("createdAt");

-- CreateIndex
CREATE INDEX "UserOrgDebt_userId_idx" ON "UserOrgDebt"("userId");

-- CreateIndex
CREATE INDEX "UserOrgDebt_organizationId_idx" ON "UserOrgDebt"("organizationId");

-- CreateIndex
CREATE INDEX "UserOrgDebt_status_idx" ON "UserOrgDebt"("status");

-- CreateIndex
CREATE INDEX "UserOrgDebt_createdAt_idx" ON "UserOrgDebt"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrgDebt_userId_organizationId_key" ON "UserOrgDebt"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "DebtTransaction_debtId_idx" ON "DebtTransaction"("debtId");

-- CreateIndex
CREATE INDEX "DebtTransaction_transactionType_idx" ON "DebtTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "DebtTransaction_createdAt_idx" ON "DebtTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachWallet_coachId_key" ON "CoachWallet"("coachId");

-- CreateIndex
CREATE INDEX "CoachWallet_coachId_idx" ON "CoachWallet"("coachId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "CoachPayout_coachId_idx" ON "CoachPayout"("coachId");

-- CreateIndex
CREATE INDEX "CoachPayout_status_idx" ON "CoachPayout"("status");

-- CreateIndex
CREATE INDEX "CoachPayout_requestedAt_idx" ON "CoachPayout"("requestedAt");

-- CreateIndex
CREATE INDEX "CoachPlayerRelationship_coachId_idx" ON "CoachPlayerRelationship"("coachId");

-- CreateIndex
CREATE INDEX "CoachPlayerRelationship_playerId_idx" ON "CoachPlayerRelationship"("playerId");

-- CreateIndex
CREATE INDEX "CoachPlayerRelationship_status_idx" ON "CoachPlayerRelationship"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CoachPlayerRelationship_coachId_playerId_key" ON "CoachPlayerRelationship"("coachId", "playerId");

-- CreateIndex
CREATE INDEX "CoachPlayerNote_relationshipId_idx" ON "CoachPlayerNote"("relationshipId");

-- CreateIndex
CREATE INDEX "CoachPlayerNote_createdAt_idx" ON "CoachPlayerNote"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachStats_coachId_key" ON "CoachStats"("coachId");

-- CreateIndex
CREATE INDEX "CoachStats_coachId_idx" ON "CoachStats"("coachId");

-- CreateIndex
CREATE INDEX "CoachDailyStats_coachId_date_idx" ON "CoachDailyStats"("coachId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CoachDailyStats_coachId_date_key" ON "CoachDailyStats"("coachId", "date");

-- CreateIndex
CREATE INDEX "CoachSessionReview_coachId_idx" ON "CoachSessionReview"("coachId");

-- CreateIndex
CREATE INDEX "CoachSessionReview_playerId_idx" ON "CoachSessionReview"("playerId");

-- CreateIndex
CREATE INDEX "CoachSessionReview_createdAt_idx" ON "CoachSessionReview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachSessionReview_sessionId_playerId_key" ON "CoachSessionReview"("sessionId", "playerId");

-- CreateIndex
CREATE INDEX "CoachPlayerRating_coachId_idx" ON "CoachPlayerRating"("coachId");

-- CreateIndex
CREATE INDEX "CoachPlayerRating_playerId_idx" ON "CoachPlayerRating"("playerId");

-- CreateIndex
CREATE INDEX "CoachPlayerRating_sessionId_idx" ON "CoachPlayerRating"("sessionId");

-- CreateIndex
CREATE INDEX "CoachPlayerRating_createdAt_idx" ON "CoachPlayerRating"("createdAt");

-- CreateIndex
CREATE INDEX "CoachPlayerRating_isConcluded_idx" ON "CoachPlayerRating"("isConcluded");

-- CreateIndex
CREATE INDEX "Activity_coachId_idx" ON "Activity"("coachId");

-- CreateIndex
CREATE INDEX "Activity_sessionId_idx" ON "Activity"("sessionId");

-- CreateIndex
CREATE INDEX "Activity_date_idx" ON "Activity"("date");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "FormField_sectionId_idx" ON "FormField"("sectionId");

-- CreateIndex
CREATE INDEX "FormSection_templateId_idx" ON "FormSection"("templateId");

-- CreateIndex
CREATE INDEX "TaskTemplate_organizationId_idx" ON "TaskTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "TaskTemplate_role_idx" ON "TaskTemplate"("role");

-- CreateIndex
CREATE INDEX "TaskTemplate_type_idx" ON "TaskTemplate"("type");

-- CreateIndex
CREATE INDEX "Task_templateId_idx" ON "Task"("templateId");

-- CreateIndex
CREATE INDEX "Task_organizationId_idx" ON "Task"("organizationId");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Task_id_organizationId_key" ON "Task"("id", "organizationId");

-- CreateIndex
CREATE INDEX "ResourceRequest_taskId_idx" ON "ResourceRequest"("taskId");

-- CreateIndex
CREATE INDEX "ResourceRequest_requestedByUserId_idx" ON "ResourceRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "ResourceRequest_status_idx" ON "ResourceRequest"("status");

-- CreateIndex
CREATE INDEX "ResourceRequest_requestedAt_idx" ON "ResourceRequest"("requestedAt");

-- CreateIndex
CREATE INDEX "TaskSubmission_taskId_idx" ON "TaskSubmission"("taskId");

-- CreateIndex
CREATE INDEX "TaskSubmission_submittedByUserId_idx" ON "TaskSubmission"("submittedByUserId");

-- CreateIndex
CREATE INDEX "TaskSubmission_reviewStatus_idx" ON "TaskSubmission"("reviewStatus");

-- CreateIndex
CREATE INDEX "TaskSubmission_submittedAt_idx" ON "TaskSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "TaskHistory_taskId_idx" ON "TaskHistory"("taskId");

-- CreateIndex
CREATE INDEX "TaskHistory_action_idx" ON "TaskHistory"("action");

-- CreateIndex
CREATE INDEX "TaskHistory_createdAt_idx" ON "TaskHistory"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_taskId_idx" ON "NotificationLog"("taskId");

-- CreateIndex
CREATE INDEX "NotificationLog_recipientEmail_idx" ON "NotificationLog"("recipientEmail");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");

-- CreateIndex
CREATE INDEX "NotificationLog_nextRetryAt_idx" ON "NotificationLog"("nextRetryAt");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_email_idx" ON "PasswordResetOtp"("email");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_status_idx" ON "PasswordResetOtp"("status");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_expiresAt_idx" ON "PasswordResetOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "BugReport_userId_idx" ON "BugReport"("userId");

-- CreateIndex
CREATE INDEX "BugReport_status_idx" ON "BugReport"("status");

-- CreateIndex
CREATE INDEX "BugReport_severity_idx" ON "BugReport"("severity");

-- CreateIndex
CREATE INDEX "BugReport_createdAt_idx" ON "BugReport"("createdAt");

-- CreateIndex
CREATE INDEX "PlayerMetric_playerId_idx" ON "PlayerMetric"("playerId");

-- CreateIndex
CREATE INDEX "PlayerMetric_organizationId_idx" ON "PlayerMetric"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMetric_playerId_organizationId_key" ON "PlayerMetric"("playerId", "organizationId");

-- CreateIndex
CREATE INDEX "MetricHistory_metricId_idx" ON "MetricHistory"("metricId");

-- CreateIndex
CREATE INDEX "MetricHistory_sessionId_idx" ON "MetricHistory"("sessionId");

-- CreateIndex
CREATE INDEX "MetricHistory_timestamp_idx" ON "MetricHistory"("timestamp");

-- CreateIndex
CREATE INDEX "ProgressUpdate_playerId_idx" ON "ProgressUpdate"("playerId");

-- CreateIndex
CREATE INDEX "ProgressUpdate_coachId_idx" ON "ProgressUpdate"("coachId");

-- CreateIndex
CREATE INDEX "ProgressUpdate_sessionId_idx" ON "ProgressUpdate"("sessionId");

-- CreateIndex
CREATE INDEX "ProgressUpdate_timestamp_idx" ON "ProgressUpdate"("timestamp");

-- CreateIndex
CREATE INDEX "Recommendation_organizationId_idx" ON "Recommendation"("organizationId");

-- CreateIndex
CREATE INDEX "Recommendation_targetId_idx" ON "Recommendation"("targetId");

-- CreateIndex
CREATE INDEX "Recommendation_targetType_idx" ON "Recommendation"("targetType");

-- CreateIndex
CREATE INDEX "Recommendation_status_idx" ON "Recommendation"("status");

-- CreateIndex
CREATE INDEX "Recommendation_createdAt_idx" ON "Recommendation"("createdAt");

-- CreateIndex
CREATE INDEX "OrgRevenue_organizationId_idx" ON "OrgRevenue"("organizationId");

-- CreateIndex
CREATE INDEX "OrgRevenue_fromPlayerId_idx" ON "OrgRevenue"("fromPlayerId");

-- CreateIndex
CREATE INDEX "OrgRevenue_fromParentId_idx" ON "OrgRevenue"("fromParentId");

-- CreateIndex
CREATE INDEX "OrgRevenue_status_idx" ON "OrgRevenue"("status");

-- CreateIndex
CREATE INDEX "OrgRevenue_createdAt_idx" ON "OrgRevenue"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachEarning_sessionId_key" ON "CoachEarning"("sessionId");

-- CreateIndex
CREATE INDEX "CoachEarning_coachId_idx" ON "CoachEarning"("coachId");

-- CreateIndex
CREATE INDEX "CoachEarning_status_idx" ON "CoachEarning"("status");

-- CreateIndex
CREATE INDEX "CoachEarning_organizationId_idx" ON "CoachEarning"("organizationId");

-- CreateIndex
CREATE INDEX "CoachPayoutCycle_organizationId_idx" ON "CoachPayoutCycle"("organizationId");

-- CreateIndex
CREATE INDEX "CoachPayoutCycle_payoutDate_idx" ON "CoachPayoutCycle"("payoutDate");

-- CreateIndex
CREATE INDEX "CoachPayoutCycle_status_idx" ON "CoachPayoutCycle"("status");

-- CreateIndex
CREATE INDEX "CoachAvailability_coachId_idx" ON "CoachAvailability"("coachId");

-- CreateIndex
CREATE INDEX "CoachAvailability_organizationId_idx" ON "CoachAvailability"("organizationId");

-- CreateIndex
CREATE INDEX "Message_fromId_idx" ON "Message"("fromId");

-- CreateIndex
CREATE INDEX "Message_toId_idx" ON "Message"("toId");

-- CreateIndex
CREATE INDEX "Message_organizationId_idx" ON "Message"("organizationId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Announcement_organizationId_idx" ON "Announcement"("organizationId");

-- CreateIndex
CREATE INDEX "Announcement_audience_idx" ON "Announcement"("audience");

-- CreateIndex
CREATE INDEX "Notification_targetId_idx" ON "Notification"("targetId");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_eventType_idx" ON "Notification"("eventType");

-- CreateIndex
CREATE INDEX "Notification_sentAt_idx" ON "Notification"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionReport_sessionId_key" ON "SessionReport"("sessionId");

-- CreateIndex
CREATE INDEX "SessionReport_sessionId_idx" ON "SessionReport"("sessionId");

-- CreateIndex
CREATE INDEX "PlayerReport_playerId_idx" ON "PlayerReport"("playerId");

-- CreateIndex
CREATE INDEX "PlayerReport_organizationId_idx" ON "PlayerReport"("organizationId");

-- CreateIndex
CREATE INDEX "PlayerReport_reportDate_idx" ON "PlayerReport"("reportDate");

-- CreateIndex
CREATE INDEX "ParentReport_parentId_idx" ON "ParentReport"("parentId");

-- CreateIndex
CREATE INDEX "ParentReport_childId_idx" ON "ParentReport"("childId");

-- CreateIndex
CREATE INDEX "ParentReport_organizationId_idx" ON "ParentReport"("organizationId");

-- CreateIndex
CREATE INDEX "ParentReport_generatedAt_idx" ON "ParentReport"("generatedAt");

-- CreateIndex
CREATE INDEX "CoachReport_coachId_idx" ON "CoachReport"("coachId");

-- CreateIndex
CREATE INDEX "CoachReport_organizationId_idx" ON "CoachReport"("organizationId");

-- CreateIndex
CREATE INDEX "CoachReport_periodStart_idx" ON "CoachReport"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "OrgAnalytics_organizationId_key" ON "OrgAnalytics"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");

-- CreateIndex
CREATE INDEX "Invoice_playerId_idx" ON "Invoice"("playerId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "PaymentMethod_organizationId_idx" ON "PaymentMethod"("organizationId");

-- CreateIndex
CREATE INDEX "PaymentMethod_type_idx" ON "PaymentMethod"("type");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_playerId_idx" ON "Subscription"("playerId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_nextBillingDate_idx" ON "Subscription"("nextBillingDate");

-- CreateIndex
CREATE INDEX "NotificationTrigger_organizationId_idx" ON "NotificationTrigger"("organizationId");

-- CreateIndex
CREATE INDEX "NotificationTrigger_eventType_idx" ON "NotificationTrigger"("eventType");

-- CreateIndex
CREATE INDEX "NotificationTrigger_isActive_idx" ON "NotificationTrigger"("isActive");

-- CreateIndex
CREATE INDEX "EventLog_type_idx" ON "EventLog"("type");

-- CreateIndex
CREATE INDEX "EventLog_aggregateId_idx" ON "EventLog"("aggregateId");

-- CreateIndex
CREATE INDEX "EventLog_organizationId_idx" ON "EventLog"("organizationId");

-- CreateIndex
CREATE INDEX "EventLog_publishedAt_idx" ON "EventLog"("publishedAt");

-- CreateIndex
CREATE INDEX "EventLog_status_idx" ON "EventLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceModel_invoiceNumber_key" ON "InvoiceModel"("invoiceNumber");

-- CreateIndex
CREATE INDEX "InvoiceModel_organizationId_idx" ON "InvoiceModel"("organizationId");

-- CreateIndex
CREATE INDEX "InvoiceModel_playerId_idx" ON "InvoiceModel"("playerId");

-- CreateIndex
CREATE INDEX "InvoiceModel_status_idx" ON "InvoiceModel"("status");

-- CreateIndex
CREATE INDEX "InvoiceModel_dueDate_idx" ON "InvoiceModel"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceModel_invoiceNumber_organizationId_key" ON "InvoiceModel"("invoiceNumber", "organizationId");

-- CreateIndex
CREATE INDEX "LedgerEntry_organizationId_idx" ON "LedgerEntry"("organizationId");

-- CreateIndex
CREATE INDEX "LedgerEntry_sourceType_idx" ON "LedgerEntry"("sourceType");

-- CreateIndex
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_referenceId_idx" ON "LedgerEntry"("referenceId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_organizationId_idx" ON "PaymentTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_gateway_idx" ON "PaymentTransaction"("gateway");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_idempotencyKey_key" ON "PaymentTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MetricWeight_organizationId_idx" ON "MetricWeight"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricWeight_organizationId_metricName_playerLevel_key" ON "MetricWeight"("organizationId", "metricName", "playerLevel");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationConfig_organizationId_key" ON "RecommendationConfig"("organizationId");

-- CreateIndex
CREATE INDEX "RecurringSession_organizationId_idx" ON "RecurringSession"("organizationId");

-- CreateIndex
CREATE INDEX "RecurringSession_coachId_idx" ON "RecurringSession"("coachId");

-- CreateIndex
CREATE INDEX "RecurringSession_startDate_endDate_idx" ON "RecurringSession"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "OwnershipTransfer_organizationId_idx" ON "OwnershipTransfer"("organizationId");

-- CreateIndex
CREATE INDEX "OwnershipTransfer_status_idx" ON "OwnershipTransfer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OwnershipTransfer_playerId_parentId_key" ON "OwnershipTransfer"("playerId", "parentId");

-- CreateIndex
CREATE INDEX "NotificationLogModel_organizationId_idx" ON "NotificationLogModel"("organizationId");

-- CreateIndex
CREATE INDEX "NotificationLogModel_status_idx" ON "NotificationLogModel"("status");

-- CreateIndex
CREATE INDEX "NotificationLogModel_channel_idx" ON "NotificationLogModel"("channel");

-- CreateIndex
CREATE INDEX "NotificationLogModel_nextRetryAt_idx" ON "NotificationLogModel"("nextRetryAt");

-- CreateIndex
CREATE INDEX "NotificationLogModel_eventId_idx" ON "NotificationLogModel"("eventId");

-- CreateIndex
CREATE INDEX "DailyPlayerStats_organizationId_idx" ON "DailyPlayerStats"("organizationId");

-- CreateIndex
CREATE INDEX "DailyPlayerStats_date_idx" ON "DailyPlayerStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlayerStats_organizationId_playerId_date_key" ON "DailyPlayerStats"("organizationId", "playerId", "date");

-- CreateIndex
CREATE INDEX "CoachPerformanceSummary_organizationId_idx" ON "CoachPerformanceSummary"("organizationId");

-- CreateIndex
CREATE INDEX "CoachPerformanceSummary_period_idx" ON "CoachPerformanceSummary"("period");

-- CreateIndex
CREATE UNIQUE INDEX "CoachPerformanceSummary_organizationId_coachId_period_key" ON "CoachPerformanceSummary"("organizationId", "coachId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMetricsSnapshot_organizationId_key" ON "OrgMetricsSnapshot"("organizationId");

-- CreateIndex
CREATE INDEX "TestResult_suiteName_idx" ON "TestResult"("suiteName");

-- CreateIndex
CREATE INDEX "TestResult_status_idx" ON "TestResult"("status");

-- CreateIndex
CREATE INDEX "TestResult_createdAt_idx" ON "TestResult"("createdAt");

-- CreateIndex
CREATE INDEX "TestResult_testRunId_idx" ON "TestResult"("testRunId");

-- CreateIndex
CREATE INDEX "TestResult_environment_idx" ON "TestResult"("environment");

-- CreateIndex
CREATE INDEX "TestRun_runType_idx" ON "TestRun"("runType");

-- CreateIndex
CREATE INDEX "TestRun_status_idx" ON "TestRun"("status");

-- CreateIndex
CREATE INDEX "TestRun_createdAt_idx" ON "TestRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SeedLog_seedName_key" ON "SeedLog"("seedName");

-- CreateIndex
CREATE INDEX "SeedLog_status_idx" ON "SeedLog"("status");

-- CreateIndex
CREATE INDEX "SeedLog_seedName_idx" ON "SeedLog"("seedName");

-- CreateIndex
CREATE INDEX "SeedLog_createdAt_idx" ON "SeedLog"("createdAt");

-- CreateIndex
CREATE INDEX "DeveloperEmailLog_organizationId_idx" ON "DeveloperEmailLog"("organizationId");

-- CreateIndex
CREATE INDEX "DeveloperEmailLog_createdAt_idx" ON "DeveloperEmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "DeveloperEmailLog_status_idx" ON "DeveloperEmailLog"("status");

-- CreateIndex
CREATE INDEX "OrganizationPayment_organizationId_idx" ON "OrganizationPayment"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationPayment_createdAt_idx" ON "OrganizationPayment"("createdAt");

-- CreateIndex
CREATE INDEX "OrganizationPayment_status_idx" ON "OrganizationPayment"("status");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipInvitation" ADD CONSTRAINT "MembershipInvitation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Player"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referee" ADD CONSTRAINT "Referee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_employedById_fkey" FOREIGN KEY ("employedById") REFERENCES "Player"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spectator" ADD CONSTRAINT "Spectator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderProfile" ADD CONSTRAINT "ProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderProfile" ADD CONSTRAINT "ProviderProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceBooking" ADD CONSTRAINT "ServiceBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceBooking" ADD CONSTRAINT "ServiceBooking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceBooking" ADD CONSTRAINT "ServiceBooking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialization" ADD CONSTRAINT "Specialization_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPricing" ADD CONSTRAINT "CoachPricing_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachReview" ADD CONSTRAINT "CoachReview_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateScanLog" ADD CONSTRAINT "GateScanLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateScanLog" ADD CONSTRAINT "GateScanLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateScanLog" ADD CONSTRAINT "GateScanLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityIncident" ADD CONSTRAINT "SecurityIncident_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityIncident" ADD CONSTRAINT "SecurityIncident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "Referee"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Player"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchReport" ADD CONSTRAINT "MatchReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchReport" ADD CONSTRAINT "MatchReport_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "Referee"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchBallCrew" ADD CONSTRAINT "MatchBallCrew_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchBallCrew" ADD CONSTRAINT "MatchBallCrew_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchBallCrew" ADD CONSTRAINT "MatchBallCrew_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "Referee"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerBadge" ADD CONSTRAINT "PlayerBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerBadge" ADD CONSTRAINT "PlayerBadge_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformancePoint" ADD CONSTRAINT "PerformancePoint_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Court" ADD CONSTRAINT "Court_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtImage" ADD CONSTRAINT "CourtImage_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtBooking" ADD CONSTRAINT "CourtBooking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtBooking" ADD CONSTRAINT "CourtBooking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtBooking" ADD CONSTRAINT "CourtBooking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtComment" ADD CONSTRAINT "CourtComment_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtComment" ADD CONSTRAINT "CourtComment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "CourtBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtComment" ADD CONSTRAINT "CourtComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtComplaint" ADD CONSTRAINT "CourtComplaint_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtComplaint" ADD CONSTRAINT "CourtComplaint_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "CourtBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtComplaint" ADD CONSTRAINT "CourtComplaint_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipTier" ADD CONSTRAINT "MembershipTier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "MembershipTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRanking" ADD CONSTRAINT "PlayerRanking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRanking" ADD CONSTRAINT "PlayerRanking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingChallenge" ADD CONSTRAINT "RankingChallenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "ClubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingChallenge" ADD CONSTRAINT "RankingChallenge_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "ClubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingChallenge" ADD CONSTRAINT "RankingChallenge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubEvent" ADD CONSTRAINT "ClubEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWaitlist" ADD CONSTRAINT "EventWaitlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWaitlist" ADD CONSTRAINT "EventWaitlist_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracket" ADD CONSTRAINT "TournamentBracket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracket" ADD CONSTRAINT "TournamentBracket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "TournamentBracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubAnnouncement" ADD CONSTRAINT "ClubAnnouncement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAnnouncement" ADD CONSTRAINT "TournamentAnnouncement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAnnouncement" ADD CONSTRAINT "TournamentAnnouncement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReminder" ADD CONSTRAINT "EventReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReminder" ADD CONSTRAINT "PaymentReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReminder" ADD CONSTRAINT "PaymentReminder_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReminder" ADD CONSTRAINT "PaymentReminder_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubFinance" ADD CONSTRAINT "ClubFinance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "ClubFinance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationRole" ADD CONSTRAINT "OrganizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "OrganizationRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationBadge" ADD CONSTRAINT "OrganizationBadge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubRating" ADD CONSTRAINT "ClubRating_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentComment" ADD CONSTRAINT "TournamentComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentComment" ADD CONSTRAINT "TournamentComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "TournamentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentComment" ADD CONSTRAINT "TournamentComment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentCommentReaction" ADD CONSTRAINT "TournamentCommentReaction_tournamentCommentId_fkey" FOREIGN KEY ("tournamentCommentId") REFERENCES "TournamentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentCommentReaction" ADD CONSTRAINT "TournamentCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollower" ADD CONSTRAINT "UserFollower_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollower" ADD CONSTRAINT "UserFollower_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAmenity" ADD CONSTRAINT "EventAmenity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmenityBooking" ADD CONSTRAINT "AmenityBooking_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "EventAmenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmenityBooking" ADD CONSTRAINT "AmenityBooking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationActivity" ADD CONSTRAINT "OrganizationActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationActivity" ADD CONSTRAINT "OrganizationActivity_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleAppeal" ADD CONSTRAINT "RuleAppeal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleAppeal" ADD CONSTRAINT "RuleAppeal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleAppeal" ADD CONSTRAINT "RuleAppeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTask" ADD CONSTRAINT "EventTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTask" ADD CONSTRAINT "EventTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTask" ADD CONSTRAINT "EventTask_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTask" ADD CONSTRAINT "EventTask_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "Staff"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSession" ADD CONSTRAINT "CoachSession_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSession" ADD CONSTRAINT "CoachSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSession" ADD CONSTRAINT "CoachSession_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSession" ADD CONSTRAINT "CoachSession_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSession" ADD CONSTRAINT "CoachSession_recurringSessionId_fkey" FOREIGN KEY ("recurringSessionId") REFERENCES "RecurringSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionBooking" ADD CONSTRAINT "SessionBooking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionBooking" ADD CONSTRAINT "SessionBooking_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgCoachingPricing" ADD CONSTRAINT "OrgCoachingPricing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierCoachingPrice" ADD CONSTRAINT "TierCoachingPrice_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "OrgCoachingPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSpecificPrice" ADD CONSTRAINT "CoachSpecificPrice_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "OrgCoachingPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSpecificPrice" ADD CONSTRAINT "CoachSpecificPrice_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgDebt" ADD CONSTRAINT "UserOrgDebt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgDebt" ADD CONSTRAINT "UserOrgDebt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtTransaction" ADD CONSTRAINT "DebtTransaction_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "UserOrgDebt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachWallet" ADD CONSTRAINT "CoachWallet_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CoachWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPayout" ADD CONSTRAINT "CoachPayout_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPlayerRelationship" ADD CONSTRAINT "CoachPlayerRelationship_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPlayerRelationship" ADD CONSTRAINT "CoachPlayerRelationship_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPlayerNote" ADD CONSTRAINT "CoachPlayerNote_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "CoachPlayerRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachStats" ADD CONSTRAINT "CoachStats_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachDailyStats" ADD CONSTRAINT "CoachDailyStats_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSessionReview" ADD CONSTRAINT "CoachSessionReview_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSessionReview" ADD CONSTRAINT "CoachSessionReview_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPlayerRating" ADD CONSTRAINT "CoachPlayerRating_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPlayerRating" ADD CONSTRAINT "CoachPlayerRating_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPlayerRating" ADD CONSTRAINT "CoachPlayerRating_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSection" ADD CONSTRAINT "FormSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Staff"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRequest" ADD CONSTRAINT "ResourceRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRequest" ADD CONSTRAINT "ResourceRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceRequest" ADD CONSTRAINT "ResourceRequest_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetOtp" ADD CONSTRAINT "PasswordResetOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMetric" ADD CONSTRAINT "PlayerMetric_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMetric" ADD CONSTRAINT "PlayerMetric_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricHistory" ADD CONSTRAINT "MetricHistory_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "PlayerMetric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricHistory" ADD CONSTRAINT "MetricHistory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressUpdate" ADD CONSTRAINT "ProgressUpdate_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressUpdate" ADD CONSTRAINT "ProgressUpdate_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgRevenue" ADD CONSTRAINT "OrgRevenue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachEarning" ADD CONSTRAINT "CoachEarning_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachEarning" ADD CONSTRAINT "CoachEarning_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPayoutCycle" ADD CONSTRAINT "CoachPayoutCycle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAvailability" ADD CONSTRAINT "CoachAvailability_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAvailability" ADD CONSTRAINT "CoachAvailability_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReport" ADD CONSTRAINT "SessionReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerReport" ADD CONSTRAINT "PlayerReport_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerReport" ADD CONSTRAINT "PlayerReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentReport" ADD CONSTRAINT "ParentReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachReport" ADD CONSTRAINT "CoachReport_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachReport" ADD CONSTRAINT "CoachReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgAnalytics" ADD CONSTRAINT "OrgAnalytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTrigger" ADD CONSTRAINT "NotificationTrigger_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceModel" ADD CONSTRAINT "InvoiceModel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceModel" ADD CONSTRAINT "InvoiceModel_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceModel" ADD CONSTRAINT "InvoiceModel_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricWeight" ADD CONSTRAINT "MetricWeight_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationConfig" ADD CONSTRAINT "RecommendationConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSession" ADD CONSTRAINT "RecurringSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSession" ADD CONSTRAINT "RecurringSession_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLogModel" ADD CONSTRAINT "NotificationLogModel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlayerStats" ADD CONSTRAINT "DailyPlayerStats_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlayerStats" ADD CONSTRAINT "DailyPlayerStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPerformanceSummary" ADD CONSTRAINT "CoachPerformanceSummary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPerformanceSummary" ADD CONSTRAINT "CoachPerformanceSummary_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMetricsSnapshot" ADD CONSTRAINT "OrgMetricsSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperEmailLog" ADD CONSTRAINT "DeveloperEmailLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationPayment" ADD CONSTRAINT "OrganizationPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

