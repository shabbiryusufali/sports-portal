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

export async function createEvent(form: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const team_id = String(form.get("teamId"));
  const rawType = String(form.get("type")).toUpperCase() as EventType;
  const start = new Date(String(form.get("start")));
  const end = new Date(String(form.get("end")));
  const notes = (form.get("notes") as string) || null;
  const name = (form.get("name") as string)?.trim() || `${rawType} session`;
  const location = (form.get("location") as string) || null;

  if (!team_id || !rawType || isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid input");
  }
  if (end <= start) throw new Error("End time must be after start time");

  const team = await prisma.team.findUnique({
    where: { id: team_id },
    select: { sport_id: true },
  });
  if (!team) throw new Error("Team not found");

  await prisma.event.create({
    data: {
      name,
      event_type: rawType,
      start_time: start,
      end_time: end,
      notes,
      location,
      sport: { connect: { id: team.sport_id } },
      organizer: { connect: { id: session.user.id } },
      participants: { connect: { id: team_id } },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events/new");
}
