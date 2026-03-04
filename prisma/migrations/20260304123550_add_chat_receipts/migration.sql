-- AlterTable
ALTER TABLE "public"."ChatMessage" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "readAt" TIMESTAMP(3);
