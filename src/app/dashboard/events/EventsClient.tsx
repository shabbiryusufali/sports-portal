"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Sport = { id: string; name: string };
type Event = {
  id: string; name: string; sport: Sport;
  event_type: "PRACTICE" | "GAME" | "TOURNAMENT";
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  start_time: string; end_time: string; location: string | null;
  organizer: { id: string; name: string | null; email: string };
  participants: { id: string; name: string }[];
  matchCount: number;
};

interface Props { events: Event[]; sports: Sport[]; currentUserId: string; }

const STATUS_CFG = {
  SCHEDULED: { label: "Scheduled", cls: "badge-blue" },
  ONGOING:   { label: "Live",      cls: "badge-green" },
  COMPLETED: { label: "Done",      cls: "badge-zinc" },
  CANCELLED: { label: "Cancelled", cls: "badge-red" },
} as const;

const TYPE_CFG = {
  PRACTICE:   { icon: "🏃", bg: "rgba(255,255,255,0.04)" },
  GAME:       { icon: "⚡", bg: "rgba(96,165,250,0.08)" },
  TOURNAMENT: { icon: "🏆", bg: "rgba(192,132,252,0.08)" },
} as const;

export default function EventsClient({ events, sports, currentUserId }: Props) {
  const [sportFilter,  setSportFilter]  = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => events.filter((e) => {
    if (sportFilter  !== "all" && e.sport.id   !== sportFilter)  return false;
    if (typeFilter   !== "all" && e.event_type !== typeFilter)   return false;
    if (statusFilter !== "all" && e.status     !== statusFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [events, sportFilter, typeFilter, statusFilter, search]);

  const liveCount = events.filter((e) => e.status === "ONGOING").length;

  return (
    <div>
      {liveCount > 0 && (
        <div className="sp-notice sp-notice-ok" style={{ marginBottom: 20 }}>
          <span className="pulse-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
          <span style={{ fontWeight: 700 }}>{liveCount} live event{liveCount > 1 ? "s" : ""} right now</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events…" className="sp-input" style={{ flex: "1 1 200px", maxWidth: 280 }} />
        <select value={sportFilter}  onChange={(e) => setSportFilter(e.target.value)}  className="sp-select">
          <option value="all">All sports</option>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={typeFilter}   onChange={(e) => setTypeFilter(e.target.value)}   className="sp-select">
          <option value="all">All types</option>
          <option value="PRACTICE">Practice</option>
          <option value="GAME">Game</option>
          <option value="TOURNAMENT">Tournament</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sp-select">
          <option value="all">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ONGOING">Live</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 14, fontWeight: 500 }}>
        {filtered.length} event{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="sp-card" style={{ padding: "56px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>📅</p>
          <p style={{ color: "var(--text-secondary)" }}>No events match your filters</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((e) => {
            const type   = TYPE_CFG[e.event_type];
            const status = STATUS_CFG[e.status];
            const isOrg  = e.organizer.id === currentUserId;
            return (
              <Link key={e.id} href={`/dashboard/events/${e.id}`} style={{ textDecoration: "none" }}>
                <div className="sp-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}
                  onMouseEnter={(el) => { (el.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(el) => { (el.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: type.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>
                    {type.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <p style={{ fontWeight: 700, fontSize: "0.9375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</p>
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                      {isOrg && <span className="badge badge-amber">Organizer</span>}
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      {e.sport.name} · {new Date(e.start_time).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>{e.participants.length} team{e.participants.length !== 1 ? "s" : ""}</span>
                    {e.matchCount > 0 && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{e.matchCount} match{e.matchCount !== 1 ? "es" : ""}</span>}
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: "1rem", flexShrink: 0 }}>›</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}