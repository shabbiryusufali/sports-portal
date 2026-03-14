/*
  Warnings:

  - You are about to drop the `_Events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_Events" DROP CONSTRAINT "_Events_A_fkey";

-- DropForeignKey
ALTER TABLE "_Events" DROP CONSTRAINT "_Events_B_fkey";

-- DropTable
DROP TABLE "_Events";

-- CreateTable
CREATE TABLE "_TeamEvents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeamEvents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PlayerEvents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PlayerEvents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TeamEvents_B_index" ON "_TeamEvents"("B");

-- CreateIndex
CREATE INDEX "_PlayerEvents_B_index" ON "_PlayerEvents"("B");

-- AddForeignKey
ALTER TABLE "_TeamEvents" ADD CONSTRAINT "_TeamEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamEvents" ADD CONSTRAINT "_TeamEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlayerEvents" ADD CONSTRAINT "_PlayerEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlayerEvents" ADD CONSTRAINT "_PlayerEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
