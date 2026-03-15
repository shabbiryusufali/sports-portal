"use server";

import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSports() {
  return prisma.sport.findMany({ orderBy: { name: "asc" } });
}

export async function getTeamsData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [allTeams, player] = await Promise.all([
    prisma.team.findMany({
      where: { is_active: true },
      include: {
        sport: true,
        captain: { include: { user: true } },
        _count: { select: { members: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.player.findUnique({
      where: { id: session.user.id },
      select: { teams: { select: { id: true } } },
    }),
  ]);

  const memberTeamIds = new Set(player?.teams.map((t) => t.id) ?? []);
  return { allTeams, memberTeamIds };
}

export async function createTeam(
  form: FormData,
): Promise<{ success: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "Not authenticated" };

  const name = (form.get("name") as string)?.trim();
  const sport_id = form.get("sport_id") as string;

  if (!name || !sport_id)
    return { success: false, message: "Name and sport are required." };
  if (name.length < 2)
    return {
      success: false,
      message: "Team name must be at least 2 characters.",
    };

  const player = await prisma.player.findUnique({
    where: { id: session.user.id },
  });
  if (!player)
    return {
      success: false,
      message: "You must complete your player profile before creating a team.",
    };

  const sport = await prisma.sport.findUnique({ where: { id: sport_id } });
  if (!sport) return { success: false, message: "Invalid sport selected." };

  await prisma.team.create({
    data: {
      name,
      sport: { connect: { id: sport_id } },
      captain: { connect: { id: player.id } },
      members: { connect: { id: player.id } },
    },
  });

  revalidatePath("/dashboard/teams");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function joinTeam(
  teamId: string,
): Promise<{ success: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "Not authenticated" };

  const player = await prisma.player.findUnique({
    where: { id: session.user.id },
  });
  if (!player)
    return { success: false, message: "Complete your player profile first." };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: { select: { id: true } } },
  });
  if (!team) return { success: false, message: "Team not found." };
  if (team.members.some((m) => m.id === player.id))
    return {
      success: false,
      message: "You are already a member of this team.",
    };

  await prisma.team.update({
    where: { id: teamId },
    data: { members: { connect: { id: player.id } } },
  });

  revalidatePath("/dashboard/teams");
  revalidatePath(`/dashboard/teams/${teamId}`);
  return { success: true };
}

export async function leaveTeam(
  teamId: string,
): Promise<{ success: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "Not authenticated" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { captain_id: true },
  });
  if (!team) return { success: false, message: "Team not found." };

  // Captains must transfer captaincy before leaving
  if (team.captain_id === session.user.id)
    return {
      success: false,
      message:
        "You are the captain. Transfer captaincy to another member before leaving.",
    };

  await prisma.team.update({
    where: { id: teamId },
    data: { members: { disconnect: { id: session.user.id } } },
  });

  revalidatePath("/dashboard/teams");
  revalidatePath(`/dashboard/teams/${teamId}`);
  return { success: true };
}
