-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('PRACTICE', 'GAME', 'TOURNAMENT');

-- CreateEnum
CREATE TYPE "public"."MatchType" AS ENUM ('FRIENDLY', 'TOURNAMENT');

-- CreateTable
CREATE TABLE "public"."Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "captain_id" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "sport_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "event_type" "public"."EventType" NOT NULL DEFAULT 'PRACTICE',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "registration_deadline" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_team_sport" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Player" (
    "id" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "bio" TEXT,
    "profile_picture" TEXT,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserStatistics" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "sport_id" TEXT NOT NULL,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Statistics" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "minutes_played" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_statistics_id" TEXT,

    CONSTRAINT "Statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Match" (
    "id" TEXT NOT NULL,
    "sport_id" TEXT NOT NULL,
    "team_a_id" TEXT NOT NULL,
    "team_b_id" TEXT NOT NULL,
    "match_date" TIMESTAMP(3) NOT NULL,
    "event_id" TEXT,
    "score_team_a" INTEGER NOT NULL DEFAULT 0,
    "score_team_b" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."Status" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "match_type" "public"."MatchType" NOT NULL DEFAULT 'FRIENDLY',

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_Events" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Events_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_Players" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Players_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "_Events_B_index" ON "public"."_Events"("B");

-- CreateIndex
CREATE INDEX "_Players_B_index" ON "public"."_Players"("B");

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_captain_id_fkey" FOREIGN KEY ("captain_id") REFERENCES "public"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserStatistics" ADD CONSTRAINT "UserStatistics_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserStatistics" ADD CONSTRAINT "UserStatistics_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Statistics" ADD CONSTRAINT "Statistics_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Statistics" ADD CONSTRAINT "Statistics_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Statistics" ADD CONSTRAINT "Statistics_user_statistics_id_fkey" FOREIGN KEY ("user_statistics_id") REFERENCES "public"."UserStatistics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_team_a_id_fkey" FOREIGN KEY ("team_a_id") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_team_b_id_fkey" FOREIGN KEY ("team_b_id") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_Events" ADD CONSTRAINT "_Events_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_Events" ADD CONSTRAINT "_Events_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_Players" ADD CONSTRAINT "_Players_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_Players" ADD CONSTRAINT "_Players_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
