import { User } from "next-auth";
import { prisma } from "@/lib/db";

async function getUserFromDb(email: string): Promise<User | null> {
  // Dummy users array for demonstration purposes
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user || null;
}

export { getUserFromDb };
