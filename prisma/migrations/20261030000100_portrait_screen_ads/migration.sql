-- CreateEnum
CREATE TYPE "AdMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "AdMedia" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mediaType" "AdMediaType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPlaylist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Nicosia',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPlaylistItem" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "durationSeconds" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdPlaylistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdDisplay" (
    "id" TEXT NOT NULL,
    "screenNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "playlistId" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdDisplay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdMedia_sha256_key" ON "AdMedia"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "AdMedia_storageKey_key" ON "AdMedia"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "AdPlaylist_name_key" ON "AdPlaylist"("name");

-- CreateIndex
CREATE INDEX "AdPlaylistItem_mediaId_idx" ON "AdPlaylistItem"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "AdPlaylistItem_playlistId_position_key" ON "AdPlaylistItem"("playlistId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AdDisplay_screenNumber_key" ON "AdDisplay"("screenNumber");

-- CreateIndex
CREATE INDEX "AdDisplay_playlistId_idx" ON "AdDisplay"("playlistId");

-- AddForeignKey
ALTER TABLE "AdPlaylistItem" ADD CONSTRAINT "AdPlaylistItem_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "AdPlaylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPlaylistItem" ADD CONSTRAINT "AdPlaylistItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "AdMedia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdDisplay" ADD CONSTRAINT "AdDisplay_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "AdPlaylist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

