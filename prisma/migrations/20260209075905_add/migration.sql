/*
  Warnings:

  - You are about to drop the column `details` on the `AuditLog` table. All the data in the column will be lost.

*/
-- AlterTable (made safe with IF EXISTS / IF NOT EXISTS)
ALTER TABLE IF EXISTS "public"."AuditLog"
  DROP COLUMN IF EXISTS "details",
  ADD COLUMN IF NOT EXISTS "field" TEXT,
  ADD COLUMN IF NOT EXISTS "newValue" TEXT,
  ADD COLUMN IF NOT EXISTS "oldValue" TEXT,
  ADD COLUMN IF NOT EXISTS "performedBy" TEXT;

-- CreateTable
CREATE TABLE "public"."TennisRule" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TennisRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TennisRule_category_label_key" ON "public"."TennisRule"("category", "label");
