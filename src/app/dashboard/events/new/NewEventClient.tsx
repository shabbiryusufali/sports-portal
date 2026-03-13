"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/app/dashboard/actions";

type Sport = { id: string; name: string; description: string | null };
type Team = { id: string; name: string; sport: Sport };

interface Props {
  sports: Sport[];
  captainOfTeams: Team[];
}

export default function NewEventClient({ sports, captainOfTeams }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>("");

  const teamsForSport = captainOfTeams.filter((t) => t.sport.id === selectedSport);

  function handleSubmit(fd: FormData) {
    setError(null);
    start(async () => {
      const res = await createEvent(fd);
      if (!res.success) {
        setError(res.message ?? "Failed to create event.");
      } else {
        router.push(`/dashboard/events/${res.id}`);
      }
    });
  }

  return (
    <form action={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
      {/* Event Name */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Event Name</label>
        <input
          name="name"
          required
          placeholder="e.g. Friday Night Tournament"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
        />
      </div>

      {/* Sport */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sport</label>
        {sports.length === 0 ? (
          <p className="text-zinc-500 text-sm">No sports available. Ask an admin to add some.</p>
        ) : (
          <select
            name="sport_id"
            required
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
          >
            <option value="">Select a sport…</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Event Type */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Event Type</label>
        <select
          name="type"
          defaultValue="PRACTICE"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
        >
          <option value="PRACTICE">Practice</option>
          <option value="GAME">Game</option>
          <option value="TOURNAMENT">Tournament</option>
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Start</label>
          <input
            type="datetime-local"
            name="start"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">End</label>
          <input
            type="datetime-local"
            name="end"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Location</label>
        <input
          name="location"
          placeholder="e.g. Main Stadium, Field 3"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Optional details about the event…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition resize-none"
        />
      </div>

      {/* Optional team */}
      {selectedSport && teamsForSport.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Add Your Team <span className="text-zinc-600">(optional)</span>
          </label>
          <select
            name="team_id"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
          >
            <option value="">No team (open event)</option>
            {teamsForSport.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || sports.length === 0}
        className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {pending ? "Creating…" : "Create Event"}
      </button>
    </form>
  );
}