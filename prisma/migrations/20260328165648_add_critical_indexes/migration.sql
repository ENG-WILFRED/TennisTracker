-- CreateIndex
CREATE INDEX "ChatParticipant_roomId_idx" ON "public"."ChatParticipant"("roomId");

-- CreateIndex
CREATE INDEX "ChatParticipant_playerId_idx" ON "public"."ChatParticipant"("playerId");

-- CreateIndex
CREATE INDEX "ChatParticipant_isOnline_idx" ON "public"."ChatParticipant"("isOnline");

-- CreateIndex
CREATE INDEX "ChatRoom_isDM_idx" ON "public"."ChatRoom"("isDM");

-- CreateIndex
CREATE INDEX "ChatRoom_createdAt_idx" ON "public"."ChatRoom"("createdAt");

-- CreateIndex
CREATE INDEX "ClubEvent_organizationId_idx" ON "public"."ClubEvent"("organizationId");

-- CreateIndex
CREATE INDEX "ClubEvent_startDate_endDate_idx" ON "public"."ClubEvent"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "ClubEvent_createdAt_idx" ON "public"."ClubEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ClubMember_organizationId_idx" ON "public"."ClubMember"("organizationId");

-- CreateIndex
CREATE INDEX "ClubMember_playerId_idx" ON "public"."ClubMember"("playerId");

-- CreateIndex
CREATE INDEX "ClubMember_createdAt_idx" ON "public"."ClubMember"("createdAt");

-- CreateIndex
CREATE INDEX "ClubMember_paymentStatus_idx" ON "public"."ClubMember"("paymentStatus");

-- CreateIndex
CREATE INDEX "ClubMember_organizationId_paymentStatus_idx" ON "public"."ClubMember"("organizationId", "paymentStatus");

-- CreateIndex
CREATE INDEX "Court_organizationId_idx" ON "public"."Court"("organizationId");

-- CreateIndex
CREATE INDEX "Court_status_idx" ON "public"."Court"("status");

-- CreateIndex
CREATE INDEX "CourtBooking_organizationId_startTime_endTime_idx" ON "public"."CourtBooking"("organizationId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "CourtBooking_status_idx" ON "public"."CourtBooking"("status");

-- CreateIndex
CREATE INDEX "CourtBooking_courtId_startTime_idx" ON "public"."CourtBooking"("courtId", "startTime");

-- CreateIndex
CREATE INDEX "CourtBooking_createdAt_idx" ON "public"."CourtBooking"("createdAt");

-- CreateIndex
CREATE INDEX "Organization_createdAt_idx" ON "public"."Organization"("createdAt");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "public"."Organization"("slug");

-- CreateIndex
CREATE INDEX "Player_createdAt_idx" ON "public"."Player"("createdAt");

-- CreateIndex
CREATE INDEX "Staff_organizationId_idx" ON "public"."Staff"("organizationId");

-- CreateIndex
CREATE INDEX "Staff_employedById_idx" ON "public"."Staff"("employedById");

-- CreateIndex
CREATE INDEX "Staff_isActive_idx" ON "public"."Staff"("isActive");

-- CreateIndex
CREATE INDEX "Staff_createdAt_idx" ON "public"."Staff"("createdAt");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");
