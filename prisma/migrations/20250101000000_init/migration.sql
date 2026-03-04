-- CreateEnum
CREATE TYPE "ShowStatus" AS ENUM ('synced', 'created', 'live', 'settling', 'ended');

-- CreateEnum
CREATE TYPE "ShowSource" AS ENUM ('manual', 'bandsintown', 'songkick');

-- CreateEnum
CREATE TYPE "BountyStatus" AS ENUM ('open', 'settling', 'completed', 'refunded');

-- CreateEnum
CREATE TYPE "FanVote" AS ENUM ('yes', 'no', 'left_early', 'no_response');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('authorized', 'captured', 'refunded');

-- CreateTable
CREATE TABLE "Band" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "stripe_connect_id" VARCHAR(255),
    "bandsintown_id" VARCHAR(255),
    "songkick_id" VARCHAR(255),
    "average_rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "total_bounties_fulfilled" INTEGER NOT NULL DEFAULT 0,
    "total_earned" INTEGER NOT NULL DEFAULT 0,
    "default_request_cutoff" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Band_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Show" (
    "id" TEXT NOT NULL,
    "band_id" TEXT NOT NULL,
    "venue_name" VARCHAR(255) NOT NULL,
    "venue_address" TEXT NOT NULL,
    "venue_lat" DECIMAL(10,8),
    "venue_lng" DECIMAL(11,8),
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "ShowStatus" NOT NULL DEFAULT 'created',
    "request_cutoff" INTEGER,
    "requests_locked_at" TIMESTAMP(3),
    "settlement_deadline" TIMESTAMP(3),
    "source" "ShowSource" NOT NULL DEFAULT 'manual',
    "external_show_id" VARCHAR(255),
    "qr_code_url" TEXT,
    "share_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "artist" VARCHAR(255) NOT NULL,
    "external_id" VARCHAR(255),
    "genre_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bounty" (
    "id" TEXT NOT NULL,
    "show_id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "status" "BountyStatus" NOT NULL DEFAULT 'open',
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "backer_count" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(2,1),
    "settlement_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bounty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "bounty_id" TEXT NOT NULL,
    "fan_id" TEXT,
    "amount" INTEGER NOT NULL,
    "tip_amount" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER,
    "fan_vote" "FanVote" NOT NULL DEFAULT 'no_response',
    "stripe_payment_intent_id" VARCHAR(255) NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'authorized',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BandRepertoire" (
    "id" TEXT NOT NULL,
    "band_id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BandRepertoire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BandBlacklist" (
    "id" TEXT NOT NULL,
    "band_id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BandBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fan" (
    "id" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DECIMAL(10,8) NOT NULL,
    "lng" DECIMAL(11,8) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Band_email_key" ON "Band"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Show_share_url_key" ON "Show"("share_url");

-- CreateIndex
CREATE UNIQUE INDEX "BandRepertoire_band_id_song_id_key" ON "BandRepertoire"("band_id", "song_id");

-- CreateIndex
CREATE UNIQUE INDEX "BandBlacklist_band_id_song_id_key" ON "BandBlacklist"("band_id", "song_id");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_slug_key" ON "Venue"("slug");

-- AddForeignKey
ALTER TABLE "Show" ADD CONSTRAINT "Show_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "Band"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bounty" ADD CONSTRAINT "Bounty_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_bounty_id_fkey" FOREIGN KEY ("bounty_id") REFERENCES "Bounty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_fan_id_fkey" FOREIGN KEY ("fan_id") REFERENCES "Fan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandRepertoire" ADD CONSTRAINT "BandRepertoire_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "Band"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandRepertoire" ADD CONSTRAINT "BandRepertoire_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandBlacklist" ADD CONSTRAINT "BandBlacklist_band_id_fkey" FOREIGN KEY ("band_id") REFERENCES "Band"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandBlacklist" ADD CONSTRAINT "BandBlacklist_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
