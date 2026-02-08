-- CreateTable
CREATE TABLE "public"."Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "expertise" TEXT,
    "contact" TEXT,
    "photo" TEXT,
    "employedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_employedById_fkey" FOREIGN KEY ("employedById") REFERENCES "public"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
