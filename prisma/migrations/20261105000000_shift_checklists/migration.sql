-- CreateEnum
CREATE TYPE "ChecklistPhase" AS ENUM ('OPENING', 'DURING_SHIFT', 'CLOSING');

-- CreateEnum
CREATE TYPE "ChecklistSectionMode" AS ENUM ('TICK', 'COUNT', 'CHECK_IN', 'REFERENCE_PER_ORDER');

-- CreateEnum
CREATE TYPE "ChecklistItemKind" AS ENUM ('CHECK', 'TEMPERATURE', 'COUNT');

-- CreateEnum
CREATE TYPE "ChecklistEntryStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'ISSUE_BLOCKED');

-- CreateEnum
CREATE TYPE "ChecklistRunStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('OK', 'LOW', 'OUT');

-- CreateTable
CREATE TABLE "ChecklistSection" (
    "id" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "phase" "ChecklistPhase" NOT NULL,
    "title" TEXT NOT NULL,
    "mode" "ChecklistSectionMode" NOT NULL,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "ChecklistItemKind" NOT NULL DEFAULT 'CHECK',
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "haccpTarget" TEXT,
    "needsReview" TEXT,
    "sourcePage" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistRun" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "phase" "ChecklistPhase" NOT NULL,
    "shiftDate" DATE NOT NULL,
    "status" "ChecklistRunStatus" NOT NULL DEFAULT 'OPEN',
    "completedById" TEXT,
    "completedByName" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistEntry" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" "ChecklistEntryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "temperature" DOUBLE PRECISION,
    "isCompliant" BOOLEAN,
    "correctiveAction" TEXT,
    "note" TEXT,
    "recordedById" TEXT,
    "recordedByName" TEXT,
    "recordedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedByName" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistCheckIn" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "recordedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "lowAt" DOUBLE PRECISION,
    "needsReview" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCount" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "shiftDate" DATE NOT NULL,
    "count" DOUBLE PRECISION,
    "status" "StockStatus",
    "recordedById" TEXT NOT NULL,
    "recordedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "ChecklistSection_isActive_position_idx" ON "ChecklistSection"("isActive", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistSection_station_phase_title_key" ON "ChecklistSection"("station", "phase", "title");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItem_sectionId_position_key" ON "ChecklistItem"("sectionId", "position");

-- CreateIndex
CREATE INDEX "ChecklistRun_locationId_shiftDate_idx" ON "ChecklistRun"("locationId", "shiftDate");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistRun_locationId_station_phase_shiftDate_key" ON "ChecklistRun"("locationId", "station", "phase", "shiftDate");

-- CreateIndex
CREATE INDEX "ChecklistEntry_itemId_idx" ON "ChecklistEntry"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistEntry_runId_itemId_key" ON "ChecklistEntry"("runId", "itemId");

-- CreateIndex
CREATE INDEX "ChecklistCheckIn_runId_sectionId_createdAt_idx" ON "ChecklistCheckIn"("runId", "sectionId", "createdAt");

-- CreateIndex
CREATE INDEX "ChecklistCheckIn_sectionId_idx" ON "ChecklistCheckIn"("sectionId");

-- CreateIndex
CREATE INDEX "StockItem_isActive_position_idx" ON "StockItem"("isActive", "position");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_category_product_key" ON "StockItem"("category", "product");

-- CreateIndex
CREATE INDEX "StockCount_locationId_shiftDate_idx" ON "StockCount"("locationId", "shiftDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockCount_stockItemId_locationId_shiftDate_key" ON "StockCount"("stockItemId", "locationId", "shiftDate");

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ChecklistSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistRun" ADD CONSTRAINT "ChecklistRun_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistEntry" ADD CONSTRAINT "ChecklistEntry_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ChecklistRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistEntry" ADD CONSTRAINT "ChecklistEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistCheckIn" ADD CONSTRAINT "ChecklistCheckIn_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ChecklistRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistCheckIn" ADD CONSTRAINT "ChecklistCheckIn_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ChecklistSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

