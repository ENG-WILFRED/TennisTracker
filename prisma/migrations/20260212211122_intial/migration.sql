/*
  Warnings:

  - You are about to drop the column `details` on the `AuditLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."AuditLog" DROP COLUMN "details",
ADD COLUMN     "field" TEXT,
ADD COLUMN     "newValue" TEXT,
ADD COLUMN     "oldValue" TEXT,
ADD COLUMN     "performedBy" TEXT;
