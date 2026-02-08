-- AlterTable
ALTER TABLE "public"."Player" ADD COLUMN     "isClub" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "condition" TEXT,
    "clubId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."InventoryItem" ADD CONSTRAINT "InventoryItem_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "public"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
