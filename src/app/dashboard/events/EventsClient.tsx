"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Sport = { id: string; name: string };
type Event = {
  id: string;
  name: string;
  sport: Sport;
  event_type: "PRACTICE" | "GAME" | "TOURNAMENT";
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  start_time: string;
  end_time: string;
  location: string | null;
  organizer: { id: string; name: string | null; email: string };
  participants: { id: string; name: string }[];
  matchCount: number;
};

interface Props {
  events: Event[];
  sports: Sport[];
  currentUserId: string;
}

const STATUS_CONFIG = {
  SCHEDULED: { label: "Scheduled", class: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  ONGOING:   { label: "Live",      class: "text-[#00ff87] bg-[#00ff87]/10 border-[#00ff87]/20" },
  COMPLETED: { label: "Completed", class: "text-zinc-400 bg-zinc-800 border-zinc-700" },
  CANCELLED: { label: "Cancelled", class: "text-red-400 bg-red-500/10 border-red-500/20" },
} as const;

const TYPE_CONFIG = {
  PRACTICE:   { label: "Practice",   icon: "🏃", class: "text-zinc-400 bg-zinc-800" },
  GAME:       { label: "Game",       icon: "⚡", class: "text-blue-400 bg-blue-500/10" },
  TOURNAMENT: { label: "Tournament", icon: "🏆", class: "text-purple-400 bg-purple-500/10" },
} as const;

const selectClass =
  "bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff87]/50 transition";

export default function EventsClient({ events, sports, currentUserId }: Props) {
  const [sportFilter, setSportFilter] = useState("all");
  const [typeFilter, setTypeFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (sportFilter !== "all" && e.sport.id !== sportFilter) return false;
      if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [events, sportFilter, typeFilter, statusFilter, search]);

  const liveCount = events.filter((e) => e.status === "ONGOING").length;

  return (
    <div className="space-y-6">
      {/* Live banner */}
      {liveCount > 0 && (
        <div className="flex items-center gap-3 bg-[#00ff87]/5 border border-[#00ff87]/20 rounded-2xl px-5 py-4">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00ff87] animate-pulse shrink-0" />
          <p className="text-[#00ff87] font-semibold text-sm">
            {liveCount} event{liveCount > 1 ? "s" : ""} happening right now
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          className="flex-1 min-w-48 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00ff87]/50 transition"
        />
        <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className={selectClass}>
          <option value="all">All Sports</option>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
          <option value="all">All Types</option>
          <option value="PRACTICE">Practice</option>
          <option value="GAME">Game</option>
          <option value="TOURNAMENT">Tournament</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="all">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ONGOING">Live</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-zinc-600 text-sm">{filtered.length} event{filtered.length !== 1 ? "s" : ""}</p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-6 py-16 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-zinc-400 font-medium">No events match your filters</p>
          <button onClick={() => { setSportFilter("all"); setTypeFilter("all"); setStatusFilter("all"); setSearch(""); }}
            className="mt-4 text-[#00ff87] text-sm hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((event) => {
              const sc = STATUS_CONFIG[event.status];
              const tc = TYPE_CONFIG[event.event_type];
              const isOrganizer = event.organizer.id === currentUserId;
              const isPast = new Date(event.end_time) < new Date();

              return (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="flex items-center gap-5 px-6 py-4 hover:bg-white/[0.03] transition group"
                >
                  {/* Type icon */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${tc.class}`}>
                    {tc.icon}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm group-hover:text-[#00ff87] transition truncate">
                        {event.name}
                      </p>
                      {isOrganizer && (
                        <span className="shrink-0 text-xs text-zinc-600 border border-white/[0.06] px-2 py-0.5 rounded-full">
                          Organizer
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>{event.sport.name}</span>
                      <span>·</span>
                      <span>
                        {new Date(event.start_time).toLocaleDateString(undefined, {
                          weekday: "short", month: "short", day: "numeric",
                        })}
                        {" at "}
                        {new Date(event.start_time).toLocaleTimeString(undefined, {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      {event.location && (
                        <>
                          <span>·</span>
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 shrink-0">
                    {event.participants.length > 0 && (
                      <div className="hidden sm:flex -space-x-2">
                        {event.participants.slice(0, 3).map((t) => (
                          <div key={t.id} className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-400">
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                        ))}
                        {event.participants.length > 3 && (
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-500">
                            +{event.participants.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    {event.matchCount > 0 && (
                      <span className="hidden sm:block text-xs text-zinc-600">{event.matchCount} match{event.matchCount !== 1 ? "es" : ""}</span>
                    )}
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${sc.class}`}>
                      {event.status === "ONGOING" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse mr-1.5" />}
                      {sc.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}