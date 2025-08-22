/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `end` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `start` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sport` on the `Team` table. All the data in the column will be lost.
  - Added the required column `end_time` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_type` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizer_id` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sport_id` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `captain_id` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sport_id` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Event" DROP CONSTRAINT "Event_teamId_fkey";

-- AlterTable
ALTER TABLE "public"."Event" DROP COLUMN "createdAt",
DROP COLUMN "end",
DROP COLUMN "start",
DROP COLUMN "teamId",
DROP COLUMN "type",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "end_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "event_type" TEXT NOT NULL,
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "organizer_id" TEXT NOT NULL,
ADD COLUMN     "registration_deadline" TIMESTAMP(3),
ADD COLUMN     "sport_id" TEXT NOT NULL,
ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Team" DROP COLUMN "sport",
ADD COLUMN     "captain_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sport_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

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
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
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
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "match_type" TEXT NOT NULL,

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
