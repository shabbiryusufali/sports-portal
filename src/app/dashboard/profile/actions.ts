"use server";

import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { saltAndHashPassword, verifyPassword } from "@/utils/password";

export async function getProfileData() {
  const session = await auth();
  if (!session?.user) return null;
  return prisma.user.findFirst({
    where: { OR: [{ email: session.user.email ?? "" }, { id: session.user.id ?? "" }] },
    include: { player: true },
  });
}

export async function createOrUpdatePlayer(
  form: FormData,
): Promise<{ success: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "Not authenticated" };

  const firstName = (form.get("first_name") as string)?.trim();
  const lastName  = (form.get("last_name")  as string)?.trim();
  const dob       = form.get("date_of_birth") as string;
  const gender    = form.get("gender") as string;

  if (!firstName || !lastName || !dob || !gender)
    return { success: false, message: "All fields are required." };

  // FIX: parse at noon UTC so timezone offsets never shift the date by one day
  const dateOfBirth = new Date(`${dob}T12:00:00Z`);
  if (isNaN(dateOfBirth.getTime()))
    return { success: false, message: "Invalid date of birth." };

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { success: false, message: "User not found." };

  await prisma.player.upsert({
    where: { id: user.id },
    create: { id: user.id, first_name: firstName, last_name: lastName, date_of_birth: dateOfBirth, gender },
    update: { first_name: firstName, last_name: lastName, date_of_birth: dateOfBirth, gender },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function updateEmail(
  newEmail: string,
  currentPassword: string,
): Promise<{ success: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Not authenticated" };

  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@"))
    return { success: false, message: "Please enter a valid email address." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false, message: "User not found." };

  // Verify current password before allowing email change
  const valid = await verifyPassword(user.email, currentPassword);
  if (!valid) return { success: false, message: "Current password is incorrect." };

  const existing = await prisma.user.findUnique({ where: { email: trimmed } });
  if (existing && existing.id !== user.id)
    return { success: false, message: "That email is already in use." };

  await prisma.user.update({
    where: { id: user.id },
    data: { email: trimmed, emailVerified: null },
  });

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ success: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Not authenticated" };

  if (newPassword.length < 8)
    return { success: false, message: "New password must be at least 8 characters." };
  if (newPassword !== confirmPassword)
    return { success: false, message: "Passwords do not match." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false, message: "User not found." };

  const valid = await verifyPassword(user.email, currentPassword);
  if (!valid) return { success: false, message: "Current password is incorrect." };

  const password_hash = saltAndHashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { password_hash } });

  revalidatePath("/dashboard/profile");
  return { success: true };
}