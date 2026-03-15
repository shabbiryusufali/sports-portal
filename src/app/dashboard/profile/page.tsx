import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        include: {
          player: {
            include: {
              teams: { include: { sport: true } },
              matchesAsPlayerA: {
                where: { status: "COMPLETED" },
                select: {
                  score_team_a: true,
                  score_team_b: true,
                  match_date: true,
                  event: { select: { name: true } },
                },
              },
              matchesAsPlayerB: {
                where: { status: "COMPLETED" },
                select: {
                  score_team_a: true,
                  score_team_b: true,
                  match_date: true,
                  event: { select: { name: true } },
                },
              },
            },
          },
        },
      })
    : null;

  if (!user) {
    // User not found in DB — show an empty profile skeleton rather than redirecting
    return (
      <div style={{ padding: "32px 32px 40px", maxWidth: 900, width: "100%" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading profile…</p>
      </div>
    );
  }

  const allMatches = [
    ...(user.player?.matchesAsPlayerA ?? []).map((m) => ({
      result:
        m.score_team_a > m.score_team_b
          ? "W"
          : m.score_team_a < m.score_team_b
            ? "L"
            : "D",
      date: m.match_date,
      event: m.event,
    })),
    ...(user.player?.matchesAsPlayerB ?? []).map((m) => ({
      result:
        m.score_team_b > m.score_team_a
          ? "W"
          : m.score_team_b < m.score_team_a
            ? "L"
            : "D",
      date: m.match_date,
      event: m.event,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalWins = allMatches.filter((m) => m.result === "W").length;
  const totalLosses = allMatches.filter((m) => m.result === "L").length;
  const totalDraws = allMatches.filter((m) => m.result === "D").length;
  const winRate =
    allMatches.length > 0
      ? Math.round((totalWins / allMatches.length) * 100)
      : 0;
  const recentForm = allMatches.slice(0, 5).reverse();

  const resultConfig = {
    W: {
      label: "W",
      bg: "rgba(0,255,135,0.1)",
      color: "#00ff87",
      border: "rgba(0,255,135,0.2)",
    },
    L: {
      label: "L",
      bg: "rgba(248,113,113,0.1)",
      color: "#f87171",
      border: "rgba(248,113,113,0.2)",
    },
    D: {
      label: "D",
      bg: "rgba(255,255,255,0.05)",
      color: "#a1a1aa",
      border: "rgba(255,255,255,0.1)",
    },
  } as const;

  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: "32px 32px 40px", maxWidth: 900, width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div
          className="sp-avatar"
          style={{
            width: 64,
            height: 64,
            fontSize: "1.375rem",
            borderRadius: 16,
          }}
        >
          {initials}
        </div>
        <div>
          <h1 className="sp-page-title" style={{ fontSize: "1.625rem" }}>
            {user.name ?? user.username}
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginTop: 4,
            }}
          >
            @{user.username} · {user.email}
          </p>
          {user.player && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: 3,
              }}
            >
              {user.player.first_name} {user.player.last_name}
              {" · "}
              {new Date(user.player.date_of_birth).toLocaleDateString(
                undefined,
                { year: "numeric", month: "long", day: "numeric" },
              )}
            </p>
          )}
        </div>
      </div>

      {/* Stats row — only if player has matches */}
      {user.player && allMatches.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {[
              {
                label: "Matches",
                value: allMatches.length,
                color: "var(--text-primary)",
              },
              { label: "Wins", value: totalWins, color: "var(--accent)" },
              { label: "Losses", value: totalLosses, color: "#f87171" },
              {
                label: "Win Rate",
                value: `${winRate}%`,
                color:
                  winRate >= 50 ? "var(--accent)" : "var(--text-secondary)",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="sp-stat-card"
                style={{ textAlign: "center", padding: "16px 12px" }}
              >
                <p
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 900,
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </p>
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)",
                    marginTop: 6,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Recent form */}
          <div className="sp-card" style={{ padding: "16px 20px" }}>
            <p className="sp-section-title" style={{ marginBottom: 12 }}>
              Recent Form
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {recentForm.map((m, i) => {
                const rc = resultConfig[m.result as keyof typeof resultConfig];
                return (
                  <div
                    key={i}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      background: rc.bg,
                      color: rc.color,
                      border: `1px solid ${rc.border}`,
                    }}
                  >
                    {rc.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {/* Account info card */}
        <div className="sp-card" style={{ padding: "24px" }}>
          <p className="sp-section-title" style={{ marginBottom: 18 }}>
            Account
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Name", value: user.name ?? "—" },
              { label: "Email", value: user.email },
              { label: "Username", value: `@${user.username}` },
              {
                label: "Member since",
                value: new Date(user.created_at).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                }),
              },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "200px",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit forms */}
        <div>
          <p className="sp-section-title" style={{ marginBottom: 14 }}>
            {user.player ? "Update Player Info" : "Set Up Player Profile"}
          </p>
          {!user.player && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                marginBottom: 16,
              }}
            >
              Complete your profile to join teams and participate in events.
            </p>
          )}
          <ProfileForm existing={user.player ?? null} userName={user.name} />
        </div>
      </div>
    </div>
  );
}
