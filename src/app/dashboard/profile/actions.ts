"use server";

import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getProfileData() {
  const session = await auth();
  if (!session?.user) return null;

  return prisma.user.findFirst({
    where: {
      OR: [
        { email: session.user.email ?? "" },
        { id: session.user.id ?? "" },
      ],
    },
    include: { player: true },
  });
}

export async function createOrUpdatePlayer(
  form: FormData
): Promise<{ success: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "Not authenticated" };

  const firstName = (form.get("first_name") as string)?.trim();
  const lastName = (form.get("last_name") as string)?.trim();
  const dob = form.get("date_of_birth") as string;
  const gender = form.get("gender") as string;

  if (!firstName || !lastName || !dob || !gender) {
    return { success: false, message: "All fields are required." };
  }

  const dateOfBirth = new Date(dob);
  if (isNaN(dateOfBirth.getTime())) {
    return { success: false, message: "Invalid date of birth." };
  }

  // Look up the real user from DB by email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return { success: false, message: "User not found." };

  await prisma.player.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender,
    },
    update: {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}