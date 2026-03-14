"use server";

import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { EventType } from "@prisma/client";

// ── Dashboard data ────────────────────────────────────────────────────────────

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organizedEvents: {
        orderBy: { start_time: "asc" },
        include: { sport: true, participants: true },
        take: 10,
      },
      player: {
        include: {
          teams: { include: { sport: true } },
          events: {
            orderBy: { start_time: "asc" },
            include: { sport: true },
            take: 5,
          },
        },
      },
    },
  });
}

// ── Create Event ──────────────────────────────────────────────────────────────

export async function createEvent(
  form: FormData,
): Promise<{ success: boolean; message?: string; id?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Not authenticated" };

  const sport_id    = (form.get("sport_id") as string)?.trim();
  const rawType     = (String(form.get("type") ?? "PRACTICE")).toUpperCase() as EventType;
  const start       = new Date(String(form.get("start")));
  const end         = new Date(String(form.get("end")));
  const notes       = (form.get("notes")       as string) || null;
  const name        = (form.get("name")        as string)?.trim() || `${rawType} session`;
  const location    = (form.get("location")    as string) || null;
  const description = (form.get("description") as string) || null;
  const teamId      = (form.get("team_id")     as string) || null;

  if (!sport_id)
    return { success: false, message: "Sport is required." };
  if (isNaN(start.getTime()) || isNaN(end.getTime()))
    return { success: false, message: "Invalid dates." };
  if (end <= start)
    return { success: false, message: "End time must be after start time." };

  const sport = await prisma.sport.findUnique({ where: { id: sport_id } });
  if (!sport) return { success: false, message: "Sport not found." };

  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { captain_id: true },
    });
    if (!team) return { success: false, message: "Team not found." };
    if (team.captain_id !== session.user.id)
      return { success: false, message: "You must be team captain to add that team." };
  }

  // Create the event
  const event = await prisma.event.create({
    data: {
      name,
      description,
      event_type: rawType,
      start_time: start,
      end_time: end,
      notes,
      location,
      sport:     { connect: { id: sport_id } },
      organizer: { connect: { id: session.user.id } },
      ...(teamId ? { participants: { connect: { id: teamId } } } : {}),
    },
  });

  // Auto-join the organizer as an individual player if they have a player profile.
  // This way the creator always appears in the Participants list.
  const playerProfile = await prisma.player.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (playerProfile) {
    await prisma.event.update({
      where: { id: event.id },
      data: { players: { connect: { id: session.user.id } } },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  return { success: true, id: event.id };
}