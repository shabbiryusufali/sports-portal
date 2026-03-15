"use server";

import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getTeamDetail(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [team, currentUser] = await Promise.all([
    prisma.team.findUnique({
      where: { id: teamId },
      include: {
        sport: true,
        captain: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        events: {
          orderBy: { start_time: "desc" },
          take: 10,
          include: { sport: true },
        },
        matchesAsTeamA: {
          where: { status: "COMPLETED" },
          include: {
            team_b: true,
            event: { select: { id: true, name: true } },
          },
          orderBy: { match_date: "desc" },
          take: 20,
        },
        matchesAsTeamB: {
          where: { status: "COMPLETED" },
          include: {
            team_a: true,
            event: { select: { id: true, name: true } },
          },
          orderBy: { match_date: "desc" },
          take: 20,
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        is_admin: true,
        player: { select: { teams: { select: { id: true } } } },
      },
    }),
  ]);

  if (!team) return null;

  const isMember =
    currentUser?.player?.teams.some((t) => t.id === teamId) ?? false;
  const isCaptain = team.captain_id === session.user.id;
  const isAdmin = currentUser?.is_admin ?? false;

  const allMatches = [
    ...team.matchesAsTeamA.map((m) => ({
      id: m.id,
      date: m.match_date,
      opponent: m.team_b,
      scoreFor: m.score_team_a,
      scoreAgainst: m.score_team_b,
      result:
        m.score_team_a > m.score_team_b
          ? "W"
          : m.score_team_a < m.score_team_b
            ? "L"
            : "D",
      event: m.event,
    })),
    ...team.matchesAsTeamB.map((m) => ({
      id: m.id,
      date: m.match_date,
      opponent: m.team_a,
      scoreFor: m.score_team_b,
      scoreAgainst: m.score_team_a,
      result:
        m.score_team_b > m.score_team_a
          ? "W"
          : m.score_team_b < m.score_team_a
            ? "L"
            : "D",
      event: m.event,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

  const wins = allMatches.filter((m) => m.result === "W").length;
  const losses = allMatches.filter((m) => m.result === "L").length;
  const draws = allMatches.filter((m) => m.result === "D").length;
  const totalGoalsFor = allMatches.reduce((s, m) => s + m.scoreFor, 0);
  const totalGoalsAgainst = allMatches.reduce((s, m) => s + m.scoreAgainst, 0);

  return {
    team,
    allMatches,
    stats: {
      wins,
      losses,
      draws,
      totalGoalsFor,
      totalGoalsAgainst,
      played: allMatches.length,
    },
    isMember,
    isCaptain,
    isAdmin,
    currentUserId: session.user.id,
  };
}

export async function transferCaptaincy(
  teamId: string,
  newCaptainPlayerId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return { success: false, message: "Not authenticated" };

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { select: { id: true } } },
    });
    if (!team) return { success: false, message: "Team not found." };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { is_admin: true },
    });
    const isCaptain = team.captain_id === session.user.id;
    const isAdmin = user?.is_admin ?? false;

    if (!isCaptain && !isAdmin)
      return {
        success: false,
        message: "Only the captain or an admin can transfer captaincy.",
      };

    const isNewCaptainMember = team.members.some(
      (m) => m.id === newCaptainPlayerId,
    );
    if (!isNewCaptainMember)
      return {
        success: false,
        message: "The new captain must already be a team member.",
      };

    await prisma.team.update({
      where: { id: teamId },
      data: { captain: { connect: { id: newCaptainPlayerId } } },
    });

    revalidatePath(`/dashboard/teams/${teamId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}
