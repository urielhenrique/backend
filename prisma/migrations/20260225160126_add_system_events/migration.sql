-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('login', 'upgrade', 'downgrade', 'free_limit_block', 'stripe_webhook_error', 'internal_error');

-- CreateTable
CREATE TABLE "SystemEvent" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "metadata" JSONB,
    "userId" TEXT,
    "estabelecimentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemEvent_eventType_idx" ON "SystemEvent"("eventType");

-- CreateIndex
CREATE INDEX "SystemEvent_createdAt_idx" ON "SystemEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SystemEvent_estabelecimentoId_idx" ON "SystemEvent"("estabelecimentoId");

-- CreateIndex
CREATE INDEX "SystemEvent_createdAt_eventType_idx" ON "SystemEvent"("createdAt", "eventType");
