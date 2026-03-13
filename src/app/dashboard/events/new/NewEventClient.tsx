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

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#00ff87]/50 focus:bg-white/[0.06] transition";

const labelClass = "block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2";

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
    <form action={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Event Details</h2>

        <div>
          <label className={labelClass}>Event Name</label>
          <input name="name" required placeholder="e.g. Friday Night Tournament" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Sport</label>
            {sports.length === 0 ? (
              <p className="text-zinc-600 text-sm py-3">No sports yet — ask an admin to add some.</p>
            ) : (
              <select
                name="sport_id"
                required
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className={inputClass}
              >
                <option value="">Select sport…</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select name="type" defaultValue="PRACTICE" className={inputClass}>
              <option value="PRACTICE">Practice</option>
              <option value="GAME">Game</option>
              <option value="TOURNAMENT">Tournament</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input name="location" placeholder="e.g. Main Stadium, Field 3" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Optional details about the event…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Schedule</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Starts</label>
            <input type="datetime-local" name="start" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ends</label>
            <input type="datetime-local" name="end" required className={inputClass} />
          </div>
        </div>
      </div>

      {/* Optional team */}
      {selectedSport && teamsForSport.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-5">Your Team</h2>
          <label className={labelClass}>Add a Team <span className="normal-case text-zinc-600 font-normal">(optional)</span></label>
          <select name="team_id" className={inputClass}>
            <option value="">No team — open event</option>
            {teamsForSport.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || sports.length === 0}
        className="w-full bg-[#00ff87] text-zinc-900 font-bold py-3.5 rounded-xl hover:bg-[#00e87a] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        {pending ? "Creating event…" : "Create Event"}
      </button>
    </form>
  );
}