"use client";

import { useTransition, useState } from "react";
import { createEvent } from "./actions";

export default function EventForm({ teamId }: { teamId: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      action={(fd) => {
        setErr(null);
        fd.set("teamId", teamId);
        start(async () => {
          try {
            await createEvent(fd);
          } catch (e: any) {
            setErr(e.message ?? "Failed");
          }
        });
      }}
    >
      <select
        name="type"
        className="border p-2 rounded w-full"
        defaultValue="practice"
      >
        <option value="practice">Practice</option>
        <option value="game">Game</option>
        <option value="tournament">Tournament</option>
      </select>
      <input
        type="datetime-local"
        name="start"
        className="border p-2 rounded w-full"
        required
      />
      <input
        type="datetime-local"
        name="end"
        className="border p-2 rounded w-full"
        required
      />
      <input
        type="text"
        name="notes"
        placeholder="Notes"
        className="border p-2 rounded w-full"
      />
      <button disabled={pending} className="border px-4 py-2 rounded">
        {pending ? "Saving…" : "Create Event"}
      </button>
      {err && <p className="text-red-600">{err}</p>}
    </form>
  );
}
