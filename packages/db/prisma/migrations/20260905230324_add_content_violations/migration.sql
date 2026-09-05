-- AlterTable
ALTER TABLE "Copita" ADD COLUMN     "contentViolationId" TEXT,
ADD COLUMN     "finePortionArs" DECIMAL(12,2),
ADD COLUMN     "finePortionUsd" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "ContentViolation" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "collectedUsd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentViolation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentViolation_creatorId_resolvedAt_idx" ON "ContentViolation"("creatorId", "resolvedAt");

-- AddForeignKey
ALTER TABLE "ContentViolation" ADD CONSTRAINT "ContentViolation_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Copita" ADD CONSTRAINT "Copita_contentViolationId_fkey" FOREIGN KEY ("contentViolationId") REFERENCES "ContentViolation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
