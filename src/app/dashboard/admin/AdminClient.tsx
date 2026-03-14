"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  addSport, updateSport, deleteSport,
  toggleUserAdmin, toggleUserActive, deleteUser,
  updateEventStatus, deleteEvent,
  deleteTeam, restoreTeam,
  updateMatchScore, deleteMatch,
} from "./actions";

// ─── Types ──────────────────────────────────────────────────────────────────

type Sport = { id: string; name: string; description: string | null; is_team_sport: boolean; _count: { teams: number; events: number } };
type AdminUser = { id: string; name: string | null; email: string; username: string; is_admin: boolean; is_active: boolean; created_at: string; _count: { organizedEvents: number } };
type AdminEvent = { id: string; name: string; status: string; event_type: string; start_time: string; location: string | null; sport: { name: string }; organizer: { name: string | null; email: string }; _count: { matches: number; participants: number } };
type AdminTeam = { id: string; name: string; is_active: boolean; sport: { name: string }; captain: { user: { name: string | null; email: string } } | null; _count: { members: number; events: number } };
type AdminMatch = { id: string; status: string; match_date: string; score_team_a: number; score_team_b: number; match_type: string; sport: { name: string }; event: { name: string } | null; team_a: { name: string } | null; team_b: { name: string } | null; player_a: { first_name: string; last_name: string } | null; player_b: { first_name: string; last_name: string } | null };

interface Props {
  sports: Sport[];
  users: AdminUser[];
  events: AdminEvent[];
  teams: AdminTeam[];
  matches: AdminMatch[];
}

// ─── Shared UI helpers ───────────────────────────────────────────────────────

type Tab = "users" | "events" | "teams" | "matches" | "sports";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "users",   label: "Users",   emoji: "👥" },
  { id: "events",  label: "Events",  emoji: "📅" },
  { id: "teams",   label: "Teams",   emoji: "⚽" },
  { id: "matches", label: "Matches", emoji: "🏟" },
  { id: "sports",  label: "Sports",  emoji: "🏅" },
];

function Notice({ type, msg }: { type: "ok" | "err"; msg: string }) {
  return (
    <div className={`sp-notice ${type === "ok" ? "sp-notice-ok" : "sp-notice-err"}`} style={{ marginBottom: 16 }}>
      {msg}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} className="sp-input"
      style={{ maxWidth: 300, flex: "1 1 200px" }}
    />
  );
}

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "badge-blue", ONGOING: "badge-green",
  COMPLETED: "badge-zinc", CANCELLED: "badge-red",
};

// ─── Users tab ───────────────────────────────────────────────────────────────

function UsersTab({ users }: { users: AdminUser[] }) {
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [search, setSearch] = useState("");
  const [localUsers, setLocalUsers] = useState(users);

  function flash(type: "ok" | "err", msg: string) { setNotice({ type, msg }); setTimeout(() => setNotice(null), 3500); }

  function act(fn: () => Promise<{ success: boolean; message?: string }>, onSuccess: () => void) {
    start(async () => {
      const res = await fn();
      if (res.success) onSuccess();
      else flash("err", res.message ?? "Something went wrong");
    });
  }

  const filtered = useMemo(() =>
    localUsers.filter((u) =>
      !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
    ), [localUsers, search]);

  return (
    <div>
      {notice && <Notice type={notice.type} msg={notice.msg} />}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center" }}>{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="sp-card" style={{ overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 90px 90px 130px", padding: "10px 20px", borderBottom: "1px solid var(--border)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          <span>User</span><span>Joined</span><span style={{ textAlign: "center" }}>Admin</span><span style={{ textAlign: "center" }}>Active</span><span style={{ textAlign: "right" }}>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>No users found</div>
        ) : filtered.map((u) => (
          <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 90px 90px 130px", padding: "14px 20px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="sp-avatar" style={{ width: 32, height: 32, fontSize: "0.65rem", flexShrink: 0 }}>
                  {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name ?? u.email}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email} · @{u.username}</p>
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <div style={{ textAlign: "center" }}>
              <button
                disabled={pending}
                onClick={() => act(
                  () => toggleUserAdmin(u.id, !u.is_admin),
                  () => setLocalUsers((p) => p.map((x) => x.id === u.id ? { ...x, is_admin: !u.is_admin } : x))
                )}
                className={`badge ${u.is_admin ? "badge-amber" : "badge-zinc"}`}
                style={{ cursor: "pointer", border: "none", background: undefined }}
              >
                {u.is_admin ? "Admin" : "User"}
              </button>
            </div>
            <div style={{ textAlign: "center" }}>
              <button
                disabled={pending}
                onClick={() => act(
                  () => toggleUserActive(u.id, !u.is_active),
                  () => setLocalUsers((p) => p.map((x) => x.id === u.id ? { ...x, is_active: !u.is_active } : x))
                )}
                className={`badge ${u.is_active ? "badge-green" : "badge-red"}`}
                style={{ cursor: "pointer", border: "none", background: undefined }}
              >
                {u.is_active ? "Active" : "Inactive"}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              <button
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Delete user "${u.email}"? This is irreversible.`)) return;
                  act(() => deleteUser(u.id), () => setLocalUsers((p) => p.filter((x) => x.id !== u.id)));
                }}
                className="sp-btn-danger"
                style={{ padding: "5px 10px", fontSize: "0.75rem" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Events tab ──────────────────────────────────────────────────────────────

function EventsTab({ events }: { events: AdminEvent[] }) {
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [localEvents, setLocalEvents] = useState(events);

  function flash(type: "ok" | "err", msg: string) { setNotice({ type, msg }); setTimeout(() => setNotice(null), 3500); }

  const filtered = useMemo(() =>
    localEvents.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      return !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.sport.name.toLowerCase().includes(search.toLowerCase());
    }), [localEvents, search, statusFilter]);

  return (
    <div>
      {notice && <Notice type={notice.type} msg={notice.msg} />}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search events…" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sp-select">
          <option value="all">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ONGOING">Live</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center" }}>{filtered.length} event{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="sp-card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 180px", padding: "10px 20px", borderBottom: "1px solid var(--border)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          <span>Event</span><span>Sport</span><span>Status</span><span style={{ textAlign: "right" }}>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>No events found</div>
        ) : filtered.map((e) => (
          <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 180px", padding: "14px 20px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link href={`/dashboard/events/${e.id}`} style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.name}
                </Link>
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                {new Date(e.start_time).toLocaleDateString()} · {e._count.participants} teams · {e._count.matches} matches · by {e.organizer.name ?? e.organizer.email}
              </p>
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{e.sport.name}</span>
            <div>
              <select
                value={e.status}
                disabled={pending}
                className="sp-select"
                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                onChange={(ev) => {
                  const newStatus = ev.target.value as any;
                  start(async () => {
                    const res = await updateEventStatus(e.id, newStatus);
                    if (res.success) setLocalEvents((p) => p.map((x) => x.id === e.id ? { ...x, status: newStatus } : x));
                    else flash("err", res.message ?? "Failed");
                  });
                }}
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="ONGOING">Live</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              <Link href={`/dashboard/events/${e.id}`} className="sp-btn-secondary" style={{ padding: "5px 10px", fontSize: "0.75rem" }}>View</Link>
              <button
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Delete event "${e.name}" and all its matches?`)) return;
                  start(async () => {
                    const res = await deleteEvent(e.id);
                    if (res.success) setLocalEvents((p) => p.filter((x) => x.id !== e.id));
                    else flash("err", res.message ?? "Failed");
                  });
                }}
                className="sp-btn-danger"
                style={{ padding: "5px 10px", fontSize: "0.75rem" }}
              >Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Teams tab ───────────────────────────────────────────────────────────────

function TeamsTab({ teams }: { teams: AdminTeam[] }) {
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [search, setSearch] = useState("");
  const [localTeams, setLocalTeams] = useState(teams);

  function flash(type: "ok" | "err", msg: string) { setNotice({ type, msg }); setTimeout(() => setNotice(null), 3500); }

  const filtered = useMemo(() =>
    localTeams.filter((t) =>
      !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.sport.name.toLowerCase().includes(search.toLowerCase())
    ), [localTeams, search]);

  return (
    <div>
      {notice && <Notice type={notice.type} msg={notice.msg} />}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search teams…" />
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center" }}>{filtered.length} team{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="sp-card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 150px", padding: "10px 20px", borderBottom: "1px solid var(--border)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          <span>Team</span><span>Sport</span><span>Status</span><span style={{ textAlign: "right" }}>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>No teams found</div>
        ) : filtered.map((t) => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 150px", padding: "14px 20px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <Link href={`/dashboard/teams/${t.id}`} style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", textDecoration: "none" }}>{t.name}</Link>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                {t._count.members} members · {t._count.events} events · Cap: {t.captain?.user.name ?? t.captain?.user.email ?? "—"}
              </p>
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{t.sport.name}</span>
            <span className={`badge ${t.is_active ? "badge-green" : "badge-red"}`}>{t.is_active ? "Active" : "Inactive"}</span>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              {t.is_active ? (
                <button
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Deactivate team "${t.name}"?`)) return;
                    start(async () => {
                      const res = await deleteTeam(t.id);
                      if (res.success) setLocalTeams((p) => p.map((x) => x.id === t.id ? { ...x, is_active: false } : x));
                      else flash("err", res.message ?? "Failed");
                    });
                  }}
                  className="sp-btn-danger" style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                >Deactivate</button>
              ) : (
                <button
                  disabled={pending}
                  onClick={() => {
                    start(async () => {
                      const res = await restoreTeam(t.id);
                      if (res.success) setLocalTeams((p) => p.map((x) => x.id === t.id ? { ...x, is_active: true } : x));
                      else flash("err", res.message ?? "Failed");
                    });
                  }}
                  className="sp-btn-secondary" style={{ padding: "5px 10px", fontSize: "0.75rem" }}
                >Restore</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Matches tab ─────────────────────────────────────────────────────────────

function MatchesTab({ matches }: { matches: AdminMatch[] }) {
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editA, setEditA] = useState(0);
  const [editB, setEditB] = useState(0);
  const [editStatus, setEditStatus] = useState("COMPLETED");
  const [localMatches, setLocalMatches] = useState(matches);

  function flash(type: "ok" | "err", msg: string) { setNotice({ type, msg }); setTimeout(() => setNotice(null), 3500); }

  function startEdit(m: AdminMatch) {
    setEditId(m.id);
    setEditA(m.score_team_a);
    setEditB(m.score_team_b);
    setEditStatus(m.status);
  }

  function saveScore() {
    if (!editId) return;
    start(async () => {
      const res = await updateMatchScore(editId, editA, editB, editStatus as any);
      if (res.success) {
        setLocalMatches((p) => p.map((m) => m.id === editId ? { ...m, score_team_a: editA, score_team_b: editB, status: editStatus } : m));
        setEditId(null);
        flash("ok", "Score updated.");
      } else flash("err", res.message ?? "Failed");
    });
  }

  const filtered = useMemo(() =>
    localMatches.filter((m) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.team_a?.name.toLowerCase().includes(q) ||
        m.team_b?.name.toLowerCase().includes(q) ||
        m.player_a?.first_name.toLowerCase().includes(q) ||
        m.player_b?.first_name.toLowerCase().includes(q) ||
        m.event?.name.toLowerCase().includes(q) ||
        m.sport.name.toLowerCase().includes(q)
      );
    }), [localMatches, search]);

  function participantLabel(m: AdminMatch) {
    if (m.team_a || m.team_b) return `${m.team_a?.name ?? "?"} vs ${m.team_b?.name ?? "?"}`;
    if (m.player_a || m.player_b) return `${m.player_a?.first_name ?? "?"} vs ${m.player_b?.first_name ?? "?"}`;
    return "Unknown";
  }

  return (
    <div>
      {notice && <Notice type={notice.type} msg={notice.msg} />}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search matches…" />
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center" }}>{filtered.length} match{filtered.length !== 1 ? "es" : ""}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && (
          <div className="sp-card" style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>No matches found</div>
        )}
        {filtered.map((m) => (
          <div key={m.id} className="sp-card" style={{ padding: "16px 20px" }}>
            {editId === m.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{participantLabel(m)}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label className="sp-label" style={{ marginBottom: 0 }}>Score A</label>
                    <input type="number" min={0} value={editA} onChange={(e) => setEditA(+e.target.value)} className="sp-input" style={{ width: 70 }} />
                    <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>–</span>
                    <input type="number" min={0} value={editB} onChange={(e) => setEditB(+e.target.value)} className="sp-input" style={{ width: 70 }} />
                    <label className="sp-label" style={{ marginBottom: 0, marginLeft: 8 }}>Score B</label>
                  </div>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="sp-select">
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveScore} disabled={pending} className="sp-btn-primary" style={{ padding: "8px 18px" }}>Save</button>
                  <button onClick={() => setEditId(null)} className="sp-btn-ghost" style={{ padding: "8px 16px" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{participantLabel(m)}</span>
                    <span className={`badge ${STATUS_BADGE[m.status] ?? "badge-zinc"}`}>{m.status}</span>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 3 }}>
                    {m.sport.name}{m.event ? ` · ${m.event.name}` : ""} · {new Date(m.match_date).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ fontSize: "1.375rem", fontWeight: 900, color: "var(--text-primary)", minWidth: 60, textAlign: "center" }}>
                  {m.score_team_a} – {m.score_team_b}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(m)} className="sp-btn-secondary" style={{ padding: "6px 12px", fontSize: "0.78rem" }}>Edit Score</button>
                  <button
                    disabled={pending}
                    onClick={() => {
                      if (!confirm("Delete this match?")) return;
                      start(async () => {
                        const res = await deleteMatch(m.id);
                        if (res.success) setLocalMatches((p) => p.filter((x) => x.id !== m.id));
                        else flash("err", res.message ?? "Failed");
                      });
                    }}
                    className="sp-btn-danger" style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                  >Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sports tab ───────────────────────────────────────────────────────────────

function SportsTab({ sports: initialSports }: { sports: Sport[] }) {
  const [pending, start] = useTransition();
  const [sports, setSports] = useState(initialSports);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function flash(type: "ok" | "err", msg: string) { setNotice({ type, msg }); setTimeout(() => setNotice(null), 3500); }

  return (
    <div>
      {notice && <Notice type={notice.type} msg={notice.msg} />}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setShowAdd((v) => !v)} className="sp-btn-primary" style={{ padding: "8px 18px" }}>
          {showAdd ? "Cancel" : "+ Add Sport"}
        </button>
      </div>

      {showAdd && (
        <form
          action={(fd) => { start(async () => { const res = await addSport(fd); if (res.success) { flash("ok", "Sport added!"); setShowAdd(false); } else flash("err", res.message ?? "Failed"); }); }}
          className="sp-card" style={{ padding: "20px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <p className="sp-section-title">New Sport</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label className="sp-label">Name</label><input name="name" required placeholder="e.g. Basketball" className="sp-input" /></div>
            <div><label className="sp-label">Description</label><input name="description" placeholder="Optional" className="sp-input" /></div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input name="is_team_sport" type="checkbox" value="true" style={{ width: 16, height: 16, accentColor: "var(--accent)" }} /> Team sport
          </label>
          <button type="submit" disabled={pending} className="sp-btn-primary" style={{ alignSelf: "flex-start" }}>Add Sport</button>
        </form>
      )}

      <div className="sp-card" style={{ overflow: "hidden" }}>
        {sports.map((s, i) => (
          <div key={s.id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined, padding: "16px 20px" }}>
            {editId === s.id ? (
              <form
                action={(fd) => { start(async () => { const res = await updateSport(s.id, fd); if (res.success) { setEditId(null); flash("ok", "Updated!"); } else flash("err", res.message ?? "Failed"); }); }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label className="sp-label">Name</label><input name="name" required defaultValue={s.name} className="sp-input" /></div>
                  <div><label className="sp-label">Description</label><input name="description" defaultValue={s.description ?? ""} className="sp-input" /></div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input name="is_team_sport" type="checkbox" value="true" defaultChecked={s.is_team_sport} style={{ width: 16, height: 16, accentColor: "var(--accent)" }} /> Team sport
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={pending} className="sp-btn-primary" style={{ padding: "7px 16px" }}>Save</button>
                  <button type="button" onClick={() => setEditId(null)} className="sp-btn-ghost" style={{ padding: "7px 14px" }}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontWeight: 700 }}>{s.name}</p>
                    <span className={`badge ${s.is_team_sport ? "badge-blue" : "badge-purple"}`}>{s.is_team_sport ? "Team" : "Individual"}</span>
                  </div>
                  {s.description && <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>{s.description}</p>}
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 3 }}>{s._count.teams} teams · {s._count.events} events</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEditId(s.id)} className="sp-btn-secondary" style={{ padding: "6px 12px", fontSize: "0.78rem" }}>Edit</button>
                  <button
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`Delete "${s.name}"? Cannot undo.`)) return;
                      start(async () => {
                        const res = await deleteSport(s.id);
                        if (res.success) setSports((p) => p.filter((x) => x.id !== s.id));
                        else flash("err", res.message ?? "Failed");
                      });
                    }}
                    className="sp-btn-danger" style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                  >Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function AdminClient({ sports, users, events, teams, matches }: Props) {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 14, padding: 5, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: "1 1 auto",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 16px", borderRadius: 10, fontSize: "0.8375rem", fontWeight: 700,
              border: "none", cursor: "pointer",
              background: tab === t.id ? "rgba(255,255,255,0.08)" : "transparent",
              color: tab === t.id ? "var(--text-primary)" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users"   && <UsersTab   users={users} />}
      {tab === "events"  && <EventsTab  events={events} />}
      {tab === "teams"   && <TeamsTab   teams={teams} />}
      {tab === "matches" && <MatchesTab matches={matches} />}
      {tab === "sports"  && <SportsTab  sports={sports} />}
    </div>
  );
}