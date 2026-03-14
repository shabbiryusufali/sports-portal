-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_team_a_id_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_team_b_id_fkey";

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "player_a_id" TEXT,
ADD COLUMN     "player_b_id" TEXT,
ALTER COLUMN "team_a_id" DROP NOT NULL,
ALTER COLUMN "team_b_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_team_a_id_fkey" FOREIGN KEY ("team_a_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_team_b_id_fkey" FOREIGN KEY ("team_b_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player_a_id_fkey" FOREIGN KEY ("player_a_id") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player_b_id_fkey" FOREIGN KEY ("player_b_id") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
