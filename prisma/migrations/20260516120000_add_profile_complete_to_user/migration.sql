-- Add profile completeness tracking to User
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "profileComplete" BOOLEAN NOT NULL DEFAULT true;
