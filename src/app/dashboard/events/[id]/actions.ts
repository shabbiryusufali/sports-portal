"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/api/auth/auth";
import { revalidatePath } from "next/cache";

// ── Get full event data ───────────────────────────────────────────────────────

export async function getEventData(id: string) {
  const session = await auth();
  if (!session?.user) return null;
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
        players: {
          select: { id: true, first_name: true, last_name: true },
        },
        matches: {
          include: { team_a: true, team_b: true },
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

  const teamsInSport = await prisma.team.findMany({
    where: { sport_id: event.sport_id, is_active: true },
    orderBy: { name: "asc" },
  });

  const canManage = event.organizer_id === session.user.id || (user?.is_admin ?? false);

  const playerProfile = await prisma.player.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  const hasPlayerProfile = !!playerProfile;
  const isJoined = event.players.some((p) => p.id === session.user.id);

  return {
    event,
    canManage,
    teamsInSport,
    currentUserId: session.user.id,
    hasPlayerProfile,
    isJoined,
  };
}

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireOrganizerOrAdmin(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  const isAdmin = await prisma.user
    .findUnique({ where: { id: session.user.id } })
    .then((u) => u?.is_admin ?? false);

  if (!isAdmin && event.organizer_id !== session.user.id) {
    throw new Error("Not authorized");
  }
}

// ── Teams ─────────────────────────────────────────────────────────────────────

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

// ── Matches ───────────────────────────────────────────────────────────────────

export async function addMatch(
  eventId: string,
  data: {
    teamAId: string;
    teamBId: string;
    matchDate: string;
    matchType: "FRIENDLY" | "TOURNAMENT";
  },
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);

    if (!data.teamAId || !data.teamBId)
      throw new Error("Both teams are required.");
    if (data.teamAId === data.teamBId)
      throw new Error("Teams must be different.");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { sport_id: true, start_time: true },
    });
    if (!event) throw new Error("Event not found.");

    const match_date = data.matchDate
      ? new Date(data.matchDate)
      : event.start_time;

    await prisma.match.create({
      data: {
        event_id: eventId,
        team_a_id: data.teamAId,
        team_b_id: data.teamBId,
        match_date,
        match_type: data.matchType,
        sport_id: event.sport_id,
      },
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Match lifecycle ───────────────────────────────────────────────────────────

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

// ── Score a goal (increment by 1) ─────────────────────────────────────────────

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

// ── Undo last score (decrement by 1) ─────────────────────────────────────────

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
    if (currentScore <= 0)
      return { success: false, message: "Score already at 0" };

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

// ── Set score directly (overwrite both values) ────────────────────────────────
//
// Works on ONGOING and COMPLETED matches so admins/organisers can correct
// scores after the fact.

export async function setScore(
  matchId: string,
  eventId: string,
  scoreA: number,
  scoreB: number,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);

    if (
      !Number.isInteger(scoreA) ||
      !Number.isInteger(scoreB) ||
      scoreA < 0 ||
      scoreB < 0
    ) {
      throw new Error("Scores must be non-negative integers.");
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error("Match not found");
    if (match.status === "CANCELLED")
      throw new Error("Cannot edit scores of a cancelled match.");

    await prisma.match.update({
      where: { id: matchId },
      data: {
        score_team_a: scoreA,
        score_team_b: scoreB,
      },
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

// ── Event status ──────────────────────────────────────────────────────────────

export async function updateEventStatus(
  eventId: string,
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED",
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireOrganizerOrAdmin(eventId);
    await prisma.event.update({ where: { id: eventId }, data: { status } });
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ── Join / Leave event (individual player) ────────────────────────────────────

export async function joinEvent(
  eventId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");
    if (!session?.user?.id) throw new Error("Not authenticated");

    const player = await prisma.player.findUnique({
      where: { id: session.user.id },
    });
    if (!player)
      throw new Error(
        "You need a player profile to join events. Set one up on your profile page.",
      );

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        status: true,
        registration_deadline: true,
        players: { select: { id: true } },
      },
    });
    if (!event) throw new Error("Event not found.");
    if (event.status === "COMPLETED" || event.status === "CANCELLED")
      throw new Error("This event is no longer open for registration.");
    if (event.registration_deadline && new Date() > event.registration_deadline)
      throw new Error("The registration deadline has passed.");
    if (event.players.some((p) => p.id === session.user.id))
      throw new Error("You have already joined this event.");

    await prisma.event.update({
      where: { id: eventId },
      data: { players: { connect: { id: session.user.id } } },
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function leaveEvent(
  eventId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Not authenticated");

    await prisma.event.update({
      where: { id: eventId },
      data: { players: { disconnect: { id: session.user.id } } },
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}