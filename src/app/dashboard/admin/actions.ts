"use server";

import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { is_admin: true },
  });
  if (!user?.is_admin) throw new Error("Admin access required");
  return session.user.id;
}

export async function getAdminData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { is_admin: true },
  });
  if (!user?.is_admin) return null;

  const [sports, userCount, eventCount, teamCount] = await Promise.all([
    prisma.sport.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { teams: true, events: true } },
      },
    }),
    prisma.user.count(),
    prisma.event.count(),
    prisma.team.count(),
  ]);

  return { sports, userCount, eventCount, teamCount };
}

export async function addSport(
  form: FormData,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();

    const name = (form.get("name") as string)?.trim();
    const description = (form.get("description") as string)?.trim() || null;
    const is_team_sport = form.get("is_team_sport") === "true";

    if (!name) return { success: false, message: "Sport name is required." };
    if (name.length < 2) return { success: false, message: "Name must be at least 2 characters." };

    const existing = await prisma.sport.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
    if (existing) return { success: false, message: "A sport with that name already exists." };

    await prisma.sport.create({ data: { name, description, is_team_sport } });
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/events/new");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function deleteSport(
  sportId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();

    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      include: { _count: { select: { teams: true, events: true } } },
    });
    if (!sport) return { success: false, message: "Sport not found." };
    if (sport._count.teams > 0 || sport._count.events > 0) {
      return { success: false, message: "Cannot delete: sport has associated teams or events." };
    }

    await prisma.sport.delete({ where: { id: sportId } });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function updateSport(
  sportId: string,
  form: FormData,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    const name = (form.get("name") as string)?.trim();
    const description = (form.get("description") as string)?.trim() || null;
    const is_team_sport = form.get("is_team_sport") === "true";

    if (!name) return { success: false, message: "Name is required." };
    await prisma.sport.update({ where: { id: sportId }, data: { name, description, is_team_sport } });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}