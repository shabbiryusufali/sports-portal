import { auth } from "@/api/auth/auth";
import { getDashboardData } from "./actions";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  const user = await getDashboardData();

  const allEvents = [
    ...(user?.organizedEvents ?? []),
    ...(user?.player?.events ?? []),
  ];
  const seen = new Set<string>();
  const upcomingEvents = allEvents
    .filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return new Date(e.start_time) >= new Date();
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    )
    .slice(0, 6);

  const teams = user?.player?.teams ?? [];
  const hasPlayerProfile = !!user?.player;
  const displayName = session?.user?.name ?? session?.user?.email ?? "Athlete";

  return (
    <div style={{ padding: "32px 32px 40px", maxWidth: 1200, width: "100%" }}>
      {/* Page header */}
      <div className="sp-page-header">
        <div>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              marginBottom: "4px",
              fontWeight: 500,
            }}
          >
            Welcome back
          </p>
          <h1 className="sp-page-title">{displayName}</h1>
        </div>
        <Link href="/dashboard/events/new" className="sp-btn-primary">
          + New Event
        </Link>
      </div>

      {/* Profile nudge */}
      {!hasPlayerProfile && (
        <div
          className="sp-notice sp-notice-warn"
          style={{ marginBottom: "28px" }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(251,191,36,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "1rem",
            }}
          >
            ⚠
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "#fbbf24",
              }}
            >
              Complete your player profile
            </p>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
                marginTop: "2px",
              }}
            >
              Required to join teams and participate in events.
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="sp-btn-secondary"
            style={{
              fontSize: "0.8125rem",
              padding: "8px 16px",
              borderColor: "rgba(251,191,36,0.3)",
              color: "#fbbf24",
            }}
          >
            Set up →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="sp-stats-grid" style={{ marginBottom: "28px" }}>
        {[
          {
            label: "Events Organized",
            value: user?.organizedEvents?.length ?? 0,
            color: "var(--accent)",
            bg: "rgba(0,255,135,0.08)",
          },
          {
            label: "Teams",
            value: teams.length,
            color: "#60a5fa",
            bg: "rgba(96,165,250,0.08)",
          },
          {
            label: "Events Joined",
            value: user?.player?.events?.length ?? 0,
            color: "#c084fc",
            bg: "rgba(192,132,252,0.08)",
          },
        ].map((s) => (
          <div key={s.label} className="sp-stat-card">
            <p
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                marginTop: "6px",
                fontWeight: 500,
              }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Upcoming Events */}
        <section className="sp-card" style={{ overflow: "hidden" }}>
          <div className="sp-card-header">
            <h2
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 18,
                  background: "var(--accent)",
                  borderRadius: 3,
                  display: "inline-block",
                }}
              />
              Upcoming Events
            </h2>
            <Link
              href="/dashboard/events/new"
              style={{
                fontSize: "0.8125rem",
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              + New
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>📅</p>
              <p
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                No upcoming events
              </p>
              <Link
                href="/dashboard/events/new"
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  color: "var(--accent)",
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Create one →
              </Link>
            </div>
          ) : (
            <div>
              {upcomingEvents.map((e) => {
                const typeIcon =
                  e.event_type === "GAME"
                    ? "⚡"
                    : e.event_type === "TOURNAMENT"
                      ? "🏆"
                      : "🏃";
                const typeBg =
                  e.event_type === "GAME"
                    ? "rgba(96,165,250,0.1)"
                    : e.event_type === "TOURNAMENT"
                      ? "rgba(192,132,252,0.1)"
                      : "rgba(255,255,255,0.05)";
                return (
                  <Link
                    key={e.id}
                    href={`/dashboard/events/${e.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="sp-list-item"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: typeBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          flexShrink: 0,
                        }}
                      >
                        {typeIcon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {e.name}
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-secondary)",
                            marginTop: 2,
                          }}
                        >
                          {new Date(e.start_time).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                      <span
                        style={{ color: "var(--text-muted)", fontSize: "1rem" }}
                      >
                        ›
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Teams */}
        <section className="sp-card" style={{ overflow: "hidden" }}>
          <div className="sp-card-header">
            <h2
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 18,
                  background: "#60a5fa",
                  borderRadius: 3,
                  display: "inline-block",
                }}
              />
              My Teams
            </h2>
            <Link
              href="/dashboard/teams"
              style={{
                fontSize: "0.8125rem",
                color: "#60a5fa",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              View all
            </Link>
          </div>

          {teams.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚽</p>
              <p
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                No teams yet
              </p>
              <Link
                href="/dashboard/teams"
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  color: "#60a5fa",
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Browse teams →
              </Link>
            </div>
          ) : (
            <div>
              {teams.slice(0, 6).map((t: any) => (
                <Link
                  key={t.id}
                  href={`/dashboard/teams/${t.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="sp-list-item"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <div
                      className="sp-avatar"
                      style={{
                        width: 36,
                        height: 36,
                        background: "rgba(96,165,250,0.12)",
                        color: "#60a5fa",
                      }}
                    >
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.name}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          marginTop: 2,
                        }}
                      >
                        {t.sport?.name ?? "Sport"}
                      </p>
                    </div>
                    <span
                      style={{ color: "var(--text-muted)", fontSize: "1rem" }}
                    >
                      ›
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
