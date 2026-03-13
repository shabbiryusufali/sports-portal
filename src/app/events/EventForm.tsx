"use client";

import { useTransition, useState } from "react";
// Update the path below to the correct relative location of your actions file
import { createEvent } from "./actions";

export default function EventForm({ teamId }: { teamId: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <form
      className="space-y-3"
      action={(fd) => {
        setErr(null);
        setSuccess(false);
        fd.set("teamId", teamId);
        start(async () => {
          try {
            await createEvent(fd);
            setSuccess(true);
          } catch (e: any) {
            setErr(e.message ?? "Failed to create event");
          }
        });
      }}
    >
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          Event Name
        </label>
        <input
          type="text"
          name="name"
          placeholder="e.g. Tuesday Practice"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          Event Type
        </label>
        <select
          name="type"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
          defaultValue="PRACTICE"
        >
          <option value="PRACTICE">Practice</option>
          <option value="GAME">Game</option>
          <option value="TOURNAMENT">Tournament</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Start
          </label>
          <input
            type="datetime-local"
            name="start"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            End
          </label>
          <input
            type="datetime-local"
            name="end"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          Location
        </label>
        <input
          type="text"
          name="location"
          placeholder="e.g. Field 3, Main Stadium"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          Notes
        </label>
        <input
          type="text"
          name="notes"
          placeholder="Optional notes…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
        />
      </div>

      <button
        disabled={pending}
        className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Saving…" : "Create Event"}
      </button>

      {err && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
          {err}
        </p>
      )}
      {success && (
        <p className="text-[#00ff87] text-sm bg-green-900/20 border border-green-800 rounded-lg px-3 py-2">
          Event created successfully!
        </p>
      )}
    </form>
  );
}
