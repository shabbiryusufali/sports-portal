"use server";

import { prisma } from "@/lib/db";
import { EventType } from "@prisma/client";

export async function createEvent(form: FormData) {
  const team_id = String(form.get("teamId"));
  const type = String(form.get("type")) as EventType;
  const start = new Date(String(form.get("start")));
  const end = new Date(String(form.get("end")));
  const notes = (form.get("notes") as string) || null;

  if (!team_id || !type || isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid input");
  }
  if (end <= start) throw new Error("End must be after start");

  // await prisma.event.create({
  //   data: {
  //     team: { connect: { id: team_id } },
  //     event_type: type,
  //     start_time: start,
  //     end_time: end,
  //     notes,
  //   },
  // });
}
