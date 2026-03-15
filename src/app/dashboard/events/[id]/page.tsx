import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEventData } from "./actions";
import EventClient from "./EventClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: Props) {
  const session = await auth();

  const { id } = await params;
  const data = await getEventData(id);
  if (!data) redirect("/dashboard/events");

  const {
    event,
    canManage,
    isOrganizer,
    teamsInSport,
    currentUserId,
    hasPlayerProfile,
    isJoined,
  } = data;
  const isTeamSport = event.sport.is_team_sport;

  const statusCfg = {
    SCHEDULED: { label: "Scheduled", badgeClass: "badge-blue" },
    ONGOING: { label: "Live", badgeClass: "badge-green" },
    COMPLETED: { label: "Completed", badgeClass: "badge-zinc" },
    CANCELLED: { label: "Cancelled", badgeClass: "badge-red" },
  } as const;

  const typeCfg = {
    PRACTICE: { label: "Practice", icon: "🏃", badgeClass: "badge-zinc" },
    GAME: { label: "Game", icon: "⚡", badgeClass: "badge-blue" },
    TOURNAMENT: { label: "Tournament", icon: "🏆", badgeClass: "badge-purple" },
  } as const;

  const sc = statusCfg[event.status as keyof typeof statusCfg];
  const tc = typeCfg[event.event_type as keyof typeof typeCfg];

  return (
    <div style={{ padding: "32px 32px 48px", maxWidth: 900, width: "100%" }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 28,
          fontSize: "0.8125rem",
        }}
      >
        <Link
          href="/dashboard/events"
          style={{
            color: "var(--text-muted)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Events
        </Link>
        <span style={{ color: "var(--text-muted)" }}>›</span>
        <span
          style={{
            color: "var(--text-secondary)",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 260,
          }}
        >
          {event.name}
        </span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <span
            className={`badge ${sc.badgeClass}`}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            {event.status === "ONGOING" && (
              <span
                className="pulse-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "inline-block",
                }}
              />
            )}
            {sc.label}
          </span>
          <span className={`badge ${tc.badgeClass}`}>
            {tc.icon} {tc.label}
          </span>
          {canManage && <span className="badge badge-amber">Organizer</span>}
        </div>

        <h1 className="sp-page-title">{event.name}</h1>
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--text-secondary)",
            marginTop: 6,
          }}
        >
          {event.sport.name}
        </p>

        {event.description && (
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginTop: 12,
              lineHeight: 1.7,
              maxWidth: 640,
            }}
          >
            {event.description}
          </p>
        )}
      </div>

      {/* Meta cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}
      >
        {[
          {
            icon: "🗓",
            label: "Start",
            value: new Date(event.start_time).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          },
          {
            icon: "⏱",
            label: "End",
            value: new Date(event.end_time).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          },
          { icon: "📍", label: "Location", value: event.location ?? "TBD" },
          {
            icon: "👤",
            label: "Organizer",
            value: event.organizer.name ?? event.organizer.email,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="sp-card"
            style={{ padding: "18px 20px" }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                marginBottom: 10,
              }}
            >
              {item.icon}
            </div>
            <p className="sp-section-title" style={{ marginBottom: 4 }}>
              {item.label}
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.4,
              }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Interactive section */}
      <EventClient
        event={{
          id: event.id,
          status: event.status,
          sport_id: event.sport_id,
          registration_deadline:
            event.registration_deadline?.toISOString() ?? null,
          participants: event.participants.map((t) => ({
            id: t.id,
            name: t.name,
            _count: t._count,
          })),
          players: event.players.map((p) => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
          })),
          matches: event.matches.map((m) => ({
            id: m.id,
            status: m.status,
            match_type: m.match_type,
            match_date: m.match_date.toISOString(),
            score_team_a: m.score_team_a,
            score_team_b: m.score_team_b,
            team_a: m.team_a ? { name: m.team_a.name } : null,
            team_b: m.team_b ? { name: m.team_b.name } : null,
            player_a: m.player_a
              ? {
                  first_name: m.player_a.first_name,
                  last_name: m.player_a.last_name,
                }
              : null,
            player_b: m.player_b
              ? {
                  first_name: m.player_b.first_name,
                  last_name: m.player_b.last_name,
                }
              : null,
          })),
        }}
        canManage={canManage}
        teamsInSport={teamsInSport.map((t) => ({ id: t.id, name: t.name }))}
        hasPlayerProfile={hasPlayerProfile}
        isJoined={isJoined}
        currentUserId={currentUserId}
        isTeamSport={isTeamSport}
        isOrganizer={isOrganizer}
      />
    </div>
  );
}
