"use server";

import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Status, MatchType } from "@prisma/client";

async function requireOrganizerOrAdmin(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const [event, user] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { organizer_id: true } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { is_admin: true } }),
  ]);

  if (!event) throw new Error("Event not found");
  if (event.organizer_id !== session.user.id && !user?.is_admin) {
    throw new Error("Not authorized");
  }
  return session.user.id;
}

// ── Get full event data ───────────────────────────────────────────────────────

export async function getEventData(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [event, user] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        sport: true,
        organizer: { select: { id: true, name: true, email: true, is_admin: true } },
        participants: {
          include: {
            captain: { include: { user: { select: { name: true, email: true } } } },
            _count: { select: { members: true } },
          },
        },
        matches: {
          include: {
            team_a: true,
            team_b: true,
          },
          orderBy: { match_date: "asc" },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { is_admin: true },
    }),
  ]);

  if (!event) return null;

  // Teams in this sport (for adding matches)
  const teamsInSport = await prisma.team.findMany({
    where: { sport_id: event.sport_id, is_active: true },
    orderBy: { name: "asc" },
  });

  const isOrganizer = event.organizer_id === session.user.id;
  const isAdmin = user?.is_admin ?? false;
  const canManage = isOrganizer || isAdmin;

  return { event, canManage, teamsInSport, currentUserId: session.user.id };
}

// ── Add team to event ─────────────────────────────────────────────────────────

export async function addTeamToEvent(
  eventId: string,
  teamId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);
    await prisma.event.update({
      where: { id: eventId },
      data: { participants: { connect: { id: teamId } } },
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Remove team from event ────────────────────────────────────────────────────

export async function removeTeamFromEvent(
  eventId: string,
  teamId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);
    await prisma.event.update({
      where: { id: eventId },
      data: { participants: { disconnect: { id: teamId } } },
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Add match to event ────────────────────────────────────────────────────────

export async function addMatch(
  eventId: string,
  form: FormData,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);

    const team_a_id = form.get("team_a_id") as string;
    const team_b_id = form.get("team_b_id") as string;
    const match_date_str = form.get("match_date") as string;
    const match_type = (form.get("match_type") as MatchType) ?? "FRIENDLY";

    if (!team_a_id || !team_b_id) throw new Error("Both teams are required");
    if (team_a_id === team_b_id) throw new Error("Teams must be different");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { sport_id: true, start_time: true },
    });
    if (!event) throw new Error("Event not found");

    const match_date = match_date_str ? new Date(match_date_str) : event.start_time;

    await prisma.match.create({
      data: {
        sport: { connect: { id: event.sport_id } },
        team_a: { connect: { id: team_a_id } },
        team_b: { connect: { id: team_b_id } },
        match_date,
        event: { connect: { id: eventId } },
        match_type,
      },
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Start match ───────────────────────────────────────────────────────────────

export async function startMatch(
  matchId: string,
  eventId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "ONGOING" },
    });
    // Also set event to ongoing if it's still scheduled
    await prisma.event.updateMany({
      where: { id: eventId, status: "SCHEDULED" },
      data: { status: "ONGOING" },
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Score a goal ──────────────────────────────────────────────────────────────

export async function scoreGoal(
  matchId: string,
  eventId: string,
  team: "a" | "b",
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error("Match not found");
    if (match.status !== "ONGOING") throw new Error("Match is not ongoing");

    await prisma.match.update({
      where: { id: matchId },
      data:
        team === "a"
          ? { score_team_a: { increment: 1 } }
          : { score_team_b: { increment: 1 } },
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Undo last score ───────────────────────────────────────────────────────────

export async function undoScore(
  matchId: string,
  eventId: string,
  team: "a" | "b",
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error("Match not found");
    if (match.status !== "ONGOING") throw new Error("Match is not ongoing");

    const currentScore = team === "a" ? match.score_team_a : match.score_team_b;
    if (currentScore <= 0) return { success: false, message: "Score already at 0" };

    await prisma.match.update({
      where: { id: matchId },
      data:
        team === "a"
          ? { score_team_a: { decrement: 1 } }
          : { score_team_b: { decrement: 1 } },
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Complete match ────────────────────────────────────────────────────────────

export async function completeMatch(
  matchId: string,
  eventId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "COMPLETED" },
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Cancel match ──────────────────────────────────────────────────────────────

export async function cancelMatch(
  matchId: string,
  eventId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "CANCELLED" },
    });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Update event status ───────────────────────────────────────────────────────

export async function updateEventStatus(
  eventId: string,
  status: Status,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);
    await prisma.event.update({ where: { id: eventId }, data: { status } });
    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}