"use server";

import { prisma } from "@/lib/db";

export async function createEvent(form: FormData) {
  const teamId = String(form.get("teamId"));
  const type   = String(form.get("type"));
  const start  = new Date(String(form.get("start")));
  const end    = new Date(String(form.get("end")));
  const notes  = (form.get("notes") as string) || null;

  if (!teamId || !type || isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid input");
  }
  if (end <= start) throw new Error("End must be after start");

  await prisma.event.create({ data: { teamId: 'DEMO_TEAM', type, start, end, notes: notes ?? undefined } });
}
