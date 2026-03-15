"use server";

import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ── Auth guard ──────────────────────────────────────────────────────────────

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

// ── Dashboard data ──────────────────────────────────────────────────────────

export async function getAdminData() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { is_admin: true },
  });
  if (!me?.is_admin) return null;

  const [
    sports,
    users,
    events,
    teams,
    matches,
    userCount,
    eventCount,
    teamCount,
    matchCount,
  ] = await Promise.all([
    prisma.sport.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { teams: true, events: true } } },
    }),
    prisma.user.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        is_admin: true,
        is_active: true,
        created_at: true,
        _count: { select: { organizedEvents: true } },
      },
    }),
    prisma.event.findMany({
      orderBy: { start_time: "desc" },
      include: {
        sport: { select: { name: true } },
        organizer: { select: { name: true, email: true } },
        _count: { select: { matches: true, participants: true } },
      },
    }),
    prisma.team.findMany({
      orderBy: { created_at: "desc" },
      include: {
        sport: { select: { name: true } },
        captain: { include: { user: { select: { name: true, email: true } } } },
        _count: { select: { members: true, events: true } },
      },
    }),
    prisma.match.findMany({
      orderBy: { match_date: "desc" },
      take: 200,
      include: {
        sport: { select: { name: true } },
        event: { select: { name: true } },
        team_a: { select: { name: true } },
        team_b: { select: { name: true } },
        player_a: { select: { first_name: true, last_name: true } },
        player_b: { select: { first_name: true, last_name: true } },
      },
    }),
    prisma.user.count(),
    prisma.event.count(),
    prisma.team.count(),
    prisma.match.count(),
  ]);

  return {
    sports,
    users,
    events,
    teams,
    matches,
    userCount,
    eventCount,
    teamCount,
    matchCount,
  };
}

// ── Sports ──────────────────────────────────────────────────────────────────

export async function addSport(
  form: FormData,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    const name = (form.get("name") as string)?.trim();
    const description = (form.get("description") as string)?.trim() || null;
    const is_team_sport = form.get("is_team_sport") === "true";
    if (!name || name.length < 2)
      return { success: false, message: "Name must be at least 2 characters." };
    const existing = await prisma.sport.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing)
      return {
        success: false,
        message: "A sport with that name already exists.",
      };
    await prisma.sport.create({ data: { name, description, is_team_sport } });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function updateSport(
  id: string,
  form: FormData,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    const name = (form.get("name") as string)?.trim();
    const description = (form.get("description") as string)?.trim() || null;
    const is_team_sport = form.get("is_team_sport") === "true";
    if (!name) return { success: false, message: "Name is required." };
    await prisma.sport.update({
      where: { id },
      data: { name, description, is_team_sport },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function deleteSport(
  id: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    const sport = await prisma.sport.findUnique({
      where: { id },
      include: { _count: { select: { teams: true, events: true } } },
    });
    if (!sport) return { success: false, message: "Sport not found." };
    if (sport._count.teams > 0 || sport._count.events > 0)
      return {
        success: false,
        message: "Cannot delete: sport has associated teams or events.",
      };
    await prisma.sport.delete({ where: { id } });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Users ───────────────────────────────────────────────────────────────────

export async function toggleUserAdmin(
  userId: string,
  makeAdmin: boolean,
): Promise<{ success: boolean; message?: string }> {
  try {
    const adminId = await requireAdmin();
    if (userId === adminId)
      return {
        success: false,
        message: "You cannot change your own admin status.",
      };
    await prisma.user.update({
      where: { id: userId },
      data: { is_admin: makeAdmin },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function toggleUserActive(
  userId: string,
  active: boolean,
): Promise<{ success: boolean; message?: string }> {
  try {
    const adminId = await requireAdmin();
    if (userId === adminId)
      return {
        success: false,
        message: "You cannot deactivate your own account.",
      };
    await prisma.user.update({
      where: { id: userId },
      data: { is_active: active },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function deleteUser(
  userId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const adminId = await requireAdmin();
    if (userId === adminId)
      return { success: false, message: "You cannot delete your own account." };
    // Delete player first (FK constraint), then user
    await prisma.player.deleteMany({ where: { id: userId } });
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Events ──────────────────────────────────────────────────────────────────

export async function updateEventStatus(
  eventId: string,
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED",
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    await prisma.event.update({ where: { id: eventId }, data: { status } });
    revalidatePath("/dashboard/admin");
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function deleteEvent(
  eventId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    // Delete matches first, then event
    await prisma.match.deleteMany({ where: { event_id: eventId } });
    await prisma.event.delete({ where: { id: eventId } });
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Teams ───────────────────────────────────────────────────────────────────

export async function deleteTeam(
  teamId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    await prisma.team.update({
      where: { id: teamId },
      data: { is_active: false },
    });
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/teams");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function restoreTeam(
  teamId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    await prisma.team.update({
      where: { id: teamId },
      data: { is_active: true },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Matches ──────────────────────────────────────────────────────────────────

export async function updateMatchScore(
  matchId: string,
  scoreA: number,
  scoreB: number,
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED",
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    await prisma.match.update({
      where: { id: matchId },
      data: { score_team_a: scoreA, score_team_b: scoreB, status },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function deleteMatch(
  matchId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    await prisma.statistics.deleteMany({ where: { match_id: matchId } });
    await prisma.match.delete({ where: { id: matchId } });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}
