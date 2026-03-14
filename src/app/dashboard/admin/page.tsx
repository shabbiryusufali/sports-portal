import { redirect } from "next/navigation";
import { getAdminData } from "./actions";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const data = await getAdminData();
  if (!data) redirect("/dashboard");

  const stats = [
    { label: "Users",   value: data.userCount,  color: "#60a5fa"  },
    { label: "Events",  value: data.eventCount, color: "var(--accent)" },
    { label: "Teams",   value: data.teamCount,  color: "#c084fc"  },
    { label: "Matches", value: data.matchCount, color: "#f97316"  },
  ];

  return (
    <div style={{ padding: "32px 32px 40px", maxWidth: 1100, width: "100%" }}>
      {/* Header */}
      <div className="sp-page-header">
        <div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", padding: "3px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              ⚙ Admin Panel
            </span>
          </div>
          <h1 className="sp-page-title">Admin Panel</h1>
          <p className="sp-page-subtitle">Manage all users, events, teams, matches and sports.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} className="sp-stat-card">
            <p style={{ fontSize: "2rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 6, fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <AdminClient
        sports={data.sports.map((s) => ({
          id: s.id, name: s.name, description: s.description,
          is_team_sport: s.is_team_sport, _count: s._count,
        }))}
        users={data.users.map((u) => ({
          ...u,
          created_at: u.created_at.toISOString(),
        }))}
        events={data.events.map((e) => ({
          id: e.id, name: e.name, status: e.status,
          event_type: e.event_type,
          start_time: e.start_time.toISOString(),
          location: e.location,
          sport: e.sport,
          organizer: e.organizer,
          _count: e._count,
        }))}
        teams={data.teams.map((t) => ({
          id: t.id, name: t.name, is_active: t.is_active,
          sport: t.sport, captain: t.captain, _count: t._count,
        }))}
        matches={data.matches.map((m) => ({
          id: m.id, status: m.status,
          match_date: m.match_date.toISOString(),
          score_team_a: m.score_team_a,
          score_team_b: m.score_team_b,
          match_type: m.match_type,
          sport: m.sport,
          event: m.event,
          team_a: m.team_a,
          team_b: m.team_b,
          player_a: m.player_a,
          player_b: m.player_b,
        }))}
      />
    </div>
  );
}