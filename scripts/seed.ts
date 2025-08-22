import { prisma } from "@/lib/db";

async function main() {
  await prisma.team.upsert({
    where: { id: "DEMO_TEAM" },
    update: {},
    create: { id: "DEMO_TEAM", name: "Community FC", sport: "soccer" },
  });
  console.log("Seeded DEMO_TEAM");
}
main();
