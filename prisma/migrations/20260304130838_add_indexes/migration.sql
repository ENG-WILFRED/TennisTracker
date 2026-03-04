-- CreateIndex
CREATE INDEX "ChatMessage_roomId_createdAt_idx" ON "public"."ChatMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "Player_organizationId_idx" ON "public"."Player"("organizationId");
