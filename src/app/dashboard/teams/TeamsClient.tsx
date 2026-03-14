"use client";

import { useState, useTransition } from "react";
import { createTeam, joinTeam } from "./actions";
import Link from "next/link";

type Sport = { id: string; name: string };
type Team = {
  id: string;
  name: string;
  sport: Sport;
  captain: { user: { name: string | null; email: string } } | null;
  _count: { members: number };
};

interface Props {
  teams: Team[];
  memberTeamIds: string[];
  sports: Sport[];
  userId: string;
}

export default function TeamsClient({ teams, memberTeamIds, sports }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [memberIds, setMemberIds] = useState(new Set(memberTeamIds));
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");

  function handleCreate(fd: FormData) {
    setError(null); setSuccess(null);
    start(async () => {
      const res = await createTeam(fd);
      if (!res.success) setError(res.message ?? "Failed to create team.");
      else { setSuccess("Team created! Refresh to see it."); setShowCreate(false); }
    });
  }

  function handleJoin(teamId: string) {
    setError(null); setSuccess(null);
    start(async () => {
      const res = await joinTeam(teamId);
      if (!res.success) setError(res.message ?? "Failed to join team.");
      else { setMemberIds((p) => new Set([...p, teamId])); setSuccess("You joined the team!"); }
    });
  }

  const filtered = teams.filter((t) => {
    if (sportFilter !== "all" && t.sport.id !== sportFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {error   && <div className="sp-notice sp-notice-err" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="sp-notice sp-notice-ok"  style={{ marginBottom: 16 }}>{success}</div>}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams…"
          className="sp-input"
          style={{ flex: "1 1 200px", maxWidth: 300 }}
        />
        <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className="sp-select" style={{ flex: "1 1 140px" }}>
          <option value="all">All sports</option>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={() => setShowCreate((v) => !v)} className="sp-btn-primary" style={{ flexShrink: 0 }}>
          {showCreate ? "Cancel" : "+ Create Team"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form action={handleCreate} className="sp-card" style={{ padding: "24px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <p className="sp-section-title">New Team</p>
          <div>
            <label className="sp-label">Team Name</label>
            <input name="name" required placeholder="e.g. Thunder Hawks" className="sp-input" />
          </div>
          <div>
            <label className="sp-label">Sport</label>
            <select name="sport_id" required className="sp-input" style={{ appearance: "auto" }}>
              <option value="">Select a sport…</option>
              {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={pending} className="sp-btn-primary" style={{ alignSelf: "flex-start" }}>
            {pending ? "Creating…" : "Create Team"}
          </button>
        </form>
      )}

      {/* Teams grid */}
      {filtered.length === 0 ? (
        <div className="sp-card" style={{ padding: "56px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚽</p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 6 }}>No teams found</p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {search || sportFilter !== "all" ? "Try adjusting your filters" : "Be the first to create one!"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map((team) => {
            const isMember = memberIds.has(team.id);
            return (
              <div key={team.id} className="sp-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="sp-avatar" style={{ width: 44, height: 44, fontSize: "0.875rem", borderRadius: 12 }}>
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.9375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>{team.sport.name}</p>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  <span>{team._count.members} member{team._count.members !== 1 ? "s" : ""}</span>
                  {team.captain && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                      Cap: {team.captain.user.name ?? team.captain.user.email}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href={`/dashboard/teams/${team.id}`} className="sp-btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "8px 12px", fontSize: "0.8125rem" }}>
                    View
                  </Link>
                  {isMember ? (
                    <span className="badge badge-green" style={{ alignSelf: "center", padding: "5px 10px" }}>Member</span>
                  ) : (
                    <button onClick={() => handleJoin(team.id)} disabled={pending} className="sp-btn-primary" style={{ flex: 1, padding: "8px 12px", fontSize: "0.8125rem" }}>
                      {pending ? "…" : "Join"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}