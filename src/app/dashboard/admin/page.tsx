import { redirect } from "next/navigation";
import { getAdminData } from "./actions";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const data = await getAdminData();
  // getAdminData returns null for non-admins — send them to dashboard, not login
  if (!data) redirect("/dashboard");

  return (
    <div style={{ padding: "32px 32px 40px", maxWidth: 960, width: "100%" }}>
      <div className="sp-page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", padding: "3px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              ⚙ Admin Panel
            </span>
          </div>
          <h1 className="sp-page-title">Admin Panel</h1>
          <p className="sp-page-subtitle">Manage sports and monitor platform activity.</p>
        </div>
      </div>

      <div className="sp-stats-grid" style={{ marginBottom: 32 }}>
        {[
          { label: "Total Users",  value: data.userCount,  color: "#60a5fa" },
          { label: "Total Events", value: data.eventCount, color: "var(--accent)" },
          { label: "Total Teams",  value: data.teamCount,  color: "#c084fc" },
        ].map((s) => (
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
      />
    </div>
  );
}