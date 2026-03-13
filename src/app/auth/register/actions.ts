"use server";

import { prisma } from "@/lib/db";
import { saltAndHashPassword } from "@/utils/password";
import { EventType } from "@prisma/client";
import { auth } from "@/api/auth/auth";
import { revalidatePath } from "next/cache";

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function registerWithCredentials(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const { name, email, password } = data;

    if (!name || !email || !password) {
      return { success: false, message: "All fields are required." };
    }
    if (password.length < 8) {
      return { success: false, message: "Password must be at least 8 characters." };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, message: "An account with this email already exists." };
    }

    const password_hash = saltAndHashPassword(password);
    const username = name.replaceAll(" ", "").toLowerCase() + Math.floor(Math.random() * 1000);

    await prisma.user.create({
      data: { name, email, password_hash, username },
    });

    return { success: true };
  } catch (err) {
    console.error("registerWithCredentials error:", err);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function createEvent(form: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const team_id = String(form.get("teamId"));
  const rawType = String(form.get("type")).toUpperCase() as EventType;
  const start = new Date(String(form.get("start")));
  const end = new Date(String(form.get("end")));
  const notes = (form.get("notes") as string) || null;
  const name = (form.get("name") as string) || `${rawType} session`;
  const location = (form.get("location") as string) || null;

  if (!team_id || !rawType || isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid input");
  }
  if (end <= start) throw new Error("End must be after start");

  // Resolve the team's sport
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
}

// ── Dashboard data ────────────────────────────────────────────────────────────

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organizedEvents: {
        orderBy: { start_time: "asc" },
        include: { sport: true, participants: true },
        take: 10,
      },
      player: {
        include: {
          teams: {
            include: { sport: true },
          },
          events: {
            orderBy: { start_time: "asc" },
            include: { sport: true },
            take: 5,
          },
        },
      },
    },
  });

  return user;
}
