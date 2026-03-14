import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeamDetail } from "./actions";
import TeamDetailClient from "./TeamDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: Props) {
  const session = await auth();

  const { id } = await params;
  const data = await getTeamDetail(id);
  if (!data) redirect("/dashboard/teams");

  const { team, allMatches, stats, isMember, isCaptain, isAdmin, currentUserId } = data;
  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  const resultCfg = {
    W: { bg: "rgba(0,255,135,0.1)",   color: "#00ff87", border: "rgba(0,255,135,0.2)" },
    L: { bg: "rgba(248,113,113,0.1)", color: "#f87171", border: "rgba(248,113,113,0.2)" },
    D: { bg: "rgba(255,255,255,0.05)", color: "#a1a1aa", border: "rgba(255,255,255,0.1)" },
  } as const;

  return (
    <div style={{ padding: "32px 32px 48px", maxWidth: 1000, width: "100%" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, fontSize: "0.8125rem" }}>
        <Link href="/dashboard/teams" style={{ color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 }}>Teams</Link>
        <span style={{ color: "var(--text-muted)" }}>›</span>
        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{team.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <div className="sp-avatar" style={{ width: 64, height: 64, fontSize: "1.375rem", borderRadius: 16 }}>
          {team.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <h1 className="sp-page-title" style={{ fontSize: "1.625rem" }}>{team.name}</h1>
            {isCaptain && <span className="badge badge-green">Captain</span>}
            {isMember && !isCaptain && <span className="badge badge-blue">Member</span>}
            {!team.is_active && <span className="badge badge-red">Inactive</span>}
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {team.sport.name} · {team.members.length} member{team.members.length !== 1 ? "s" : ""} · Captain: {team.captain.user.name ?? team.captain.user.email}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Played",   value: stats.played,  color: "var(--text-primary)" },
          { label: "Wins",     value: stats.wins,    color: "var(--accent)" },
          { label: "Losses",   value: stats.losses,  color: "#f87171" },
          { label: "Draws",    value: stats.draws,   color: "var(--text-secondary)" },
          { label: "Win Rate", value: `${winRate}%`, color: winRate >= 50 ? "var(--accent)" : "#f87171" },
        ].map((s) => (
          <div key={s.label} className="sp-stat-card" style={{ textAlign: "center", padding: "16px 10px" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Goals row */}
      {stats.played > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          <div className="sp-card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,255,135,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>⚽</div>
            <div>
              <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>{stats.totalGoalsFor}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>Goals For</p>
            </div>
          </div>
          <div className="sp-card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>🥅</div>
            <div>
              <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#f87171", lineHeight: 1 }}>{stats.totalGoalsAgainst}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>Goals Against</p>
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>

        {/* Roster */}
        <section className="sp-card" style={{ overflow: "hidden" }}>
          <div className="sp-card-header">
            <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 18, background: "#60a5fa", borderRadius: 3, display: "inline-block" }} />
              Roster
              <span style={{ fontWeight: 400, fontSize: "0.8125rem", color: "var(--text-muted)" }}>({team.members.length})</span>
            </h2>
          </div>
          {team.members.map((member) => {
            const isCap = member.id === team.captain_id;
            return (
              <div key={member.id} className="sp-list-item" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="sp-avatar" style={{ width: 36, height: 36 }}>
                  {(member.user.name ?? member.user.email).slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {member.user.name ?? member.user.email}
                    {member.id === currentUserId && <span style={{ marginLeft: 8, fontSize: "0.72rem", color: "var(--text-muted)" }}>(you)</span>}
                  </p>
                  {isCap && <p style={{ fontSize: "0.72rem", color: "var(--accent)", marginTop: 2, fontWeight: 600 }}>Captain</p>}
                </div>
              </div>
            );
          })}

          {/* Captain + member actions */}
          {(isCaptain || isMember) && (
            <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)" }}>
              <TeamDetailClient
                teamId={team.id}
                isCaptain={isCaptain}
                isMember={isMember}
                members={team.members
                  .filter((m) => m.id !== team.captain_id)
                  .map((m) => ({ id: m.id, name: m.user.name ?? m.user.email }))}
              />
            </div>
          )}
        </section>

        {/* Events */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="sp-card" style={{ overflow: "hidden" }}>
            <div className="sp-card-header">
              <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 18, background: "#c084fc", borderRadius: 3, display: "inline-block" }} />
                Events
              </h2>
            </div>
            {team.events.length === 0 ? (
              <div style={{ padding: "32px 24px", textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>No events yet.</p>
              </div>
            ) : team.events.map((e) => {
              const statusColor = e.status === "ONGOING" ? "var(--accent)" : e.status === "COMPLETED" ? "var(--text-muted)" : e.status === "CANCELLED" ? "#f87171" : "#60a5fa";
              return (
                <Link key={e.id} href={`/dashboard/events/${e.id}`} style={{ textDecoration: "none" }}>
                  <div className="sp-list-item sp-list-item--hover" style={{ borderTop: "1px solid var(--border)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{e.sport.name} · {new Date(e.start_time).toLocaleDateString()}</p>
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: statusColor }}>{e.status}</span>
                  </div>
                </Link>
              );
            })}
          </section>

          {/* Recent matches */}
          {allMatches.length > 0 && (
            <section className="sp-card" style={{ overflow: "hidden" }}>
              <div className="sp-card-header">
                <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 18, background: "#fbbf24", borderRadius: 3, display: "inline-block" }} />
                  Recent Matches
                </h2>
              </div>
              {allMatches.slice(0, 8).map((m) => {
                const rc = resultCfg[m.result as keyof typeof resultCfg];
                return (
                  <Link key={m.id} href={m.event ? `/dashboard/events/${m.event.id}` : "#"} style={{ textDecoration: "none" }}>
                    <div className="sp-list-item" style={{ borderTop: "1px solid var(--border)" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: rc.bg, border: `1px solid ${rc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 900, color: rc.color, flexShrink: 0 }}>
                        {m.result}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          vs {m.opponent?.name ?? "Unknown"}
                        </p>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>{new Date(m.date).toLocaleDateString()}</p>
                      </div>
                      <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text-primary)" }}>{m.scoreFor}–{m.scoreAgainst}</span>
                    </div>
                  </Link>
                );
              })}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}