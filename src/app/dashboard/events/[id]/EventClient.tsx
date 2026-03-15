"use client";

import { useState, useTransition, useRef } from "react";
import {
  addTeamToEvent,
  removeTeamFromEvent,
  addMatch,
  startMatch,
  scoreGoal,
  undoScore,
  setScore,
  completeMatch,
  cancelMatch,
  updateEventStatus,
  joinEvent,
  leaveEvent,
} from "./actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type Team = { id: string; name: string };
type MatchStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
type EventStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

type Match = {
  id: string;
  status: MatchStatus;
  match_type: "FRIENDLY" | "TOURNAMENT";
  match_date: string;
  score_team_a: number;
  score_team_b: number;
  team_a: { name: string } | null;
  team_b: { name: string } | null;
  player_a: { first_name: string; last_name: string } | null;
  player_b: { first_name: string; last_name: string } | null;
};

type Participant = Team & { _count: { members: number } };

interface Props {
  event: {
    id: string;
    status: EventStatus;
    sport_id: string;
    participants: Participant[];
    players: { id: string; first_name: string; last_name: string }[];
    registration_deadline: string | null;
    matches: Match[];
  };
  canManage: boolean;
  teamsInSport: Team[];
  hasPlayerProfile: boolean;
  isJoined: boolean;
  currentUserId: string;
  isTeamSport: boolean;
  isOrganizer: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sideName(
  team: { name: string } | null,
  player: { first_name: string; last_name: string } | null,
) {
  if (team) return team.name;
  if (player) return `${player.first_name} ${player.last_name}`;
  return "Unknown";
}
function sideInitials(
  team: { name: string } | null,
  player: { first_name: string; last_name: string } | null,
) {
  if (team) return team.name.slice(0, 2).toUpperCase();
  if (player)
    return `${player.first_name[0]}${player.last_name[0]}`.toUpperCase();
  return "??";
}

const STATUS_BADGE: Record<MatchStatus, string> = {
  SCHEDULED: "badge-blue",
  ONGOING: "badge-green",
  COMPLETED: "badge-zinc",
  CANCELLED: "badge-red",
};

// ── Edit Score Modal ──────────────────────────────────────────────────────────

function EditScoreModal({
  match,
  eventId,
  scoreA: initA,
  scoreB: initB,
  onClose,
  onSaved,
}: {
  match: Match;
  eventId: string;
  scoreA: number;
  scoreB: number;
  onClose: () => void;
  onSaved: (a: number, b: number) => void;
}) {
  const [a, setA] = useState(initA);
  const [b, setB] = useState(initB);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const res = await setScore(match.id, eventId, a, b);
      if (res.success) onSaved(a, b);
      onClose();
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="sp-card"
        style={{ padding: 28, width: "100%", maxWidth: 360 }}
      >
        <p style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 20 }}>
          Edit Score
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {sideName(match.team_a, match.player_a)} vs{" "}
          {sideName(match.team_b, match.player_b)}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <input
            type="number"
            min={0}
            value={a}
            onChange={(e) => setA(+e.target.value)}
            className="sp-input"
            style={{
              width: 80,
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: 900,
            }}
          />
          <span
            style={{
              fontSize: "1.25rem",
              color: "var(--text-muted)",
              fontWeight: 700,
            }}
          >
            –
          </span>
          <input
            type="number"
            min={0}
            value={b}
            onChange={(e) => setB(+e.target.value)}
            className="sp-input"
            style={{
              width: 80,
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: 900,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={save}
            disabled={pending}
            className="sp-btn-primary"
            style={{ flex: 1 }}
          >
            {pending ? "Saving…" : "Save Score"}
          </button>
          <button onClick={onClose} className="sp-btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Match Form ────────────────────────────────────────────────────────────

function AddMatchForm({
  eventId,
  teamsInSport,
  participants,
  players,
  isTeamSport,
  onAdded,
}: {
  eventId: string;
  teamsInSport: Team[];
  participants: Participant[];
  players: { id: string; first_name: string; last_name: string }[];
  isTeamSport: boolean;
  onAdded: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options = isTeamSport
    ? participants.map((t) => ({ id: t.id, name: t.name }))
    : players.map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
      }));

  function handleSubmit(fd: FormData) {
    setError(null);
    start(async () => {
      const aId = fd.get("side_a") as string;
      const bId = fd.get("side_b") as string;
      const matchDate = fd.get("match_date") as string;
      const matchType = fd.get("match_type") as "FRIENDLY" | "TOURNAMENT";
      const res = await addMatch(eventId, {
        teamAId: isTeamSport ? aId : undefined,
        teamBId: isTeamSport ? bId : undefined,
        playerAId: !isTeamSport ? aId : undefined,
        playerBId: !isTeamSport ? bId : undefined,
        matchDate,
        matchType,
      });
      if (!res.success) setError(res.message ?? "Failed to add match.");
      else onAdded();
    });
  }

  return (
    <form
      action={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "20px 24px",
        borderTop: "1px solid var(--border)",
      }}
    >
      <p className="sp-section-title">New Match</p>
      {error && <div className="sp-notice sp-notice-err">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="sp-label">
            {isTeamSport ? "Team A" : "Player A"}
          </label>
          <select
            name="side_a"
            required
            className="sp-input"
            style={{ appearance: "auto" }}
          >
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="sp-label">
            {isTeamSport ? "Team B" : "Player B"}
          </label>
          <select
            name="side_b"
            required
            className="sp-input"
            style={{ appearance: "auto" }}
          >
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="sp-label">Match Date</label>
          <input name="match_date" type="datetime-local" className="sp-input" />
        </div>
        <div>
          <label className="sp-label">Type</label>
          <select
            name="match_type"
            className="sp-input"
            style={{ appearance: "auto" }}
          >
            <option value="FRIENDLY">Friendly</option>
            <option value="TOURNAMENT">Tournament</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="sp-btn-primary"
        style={{ alignSelf: "flex-start" }}
      >
        {pending ? "Adding…" : "Add Match"}
      </button>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EventClient({
  event,
  canManage,
  isOrganizer,
  teamsInSport,
  hasPlayerProfile,
  isJoined: initialJoined,
  currentUserId,
  isTeamSport,
}: Props) {
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{
    type: "ok" | "err";
    msg: string;
  } | null>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const addTeamRef = useRef<HTMLSelectElement>(null);

  const [scores, setScores] = useState<
    Record<string, { a: number; b: number }>
  >(() =>
    Object.fromEntries(
      event.matches.map((m) => [
        m.id,
        { a: m.score_team_a, b: m.score_team_b },
      ]),
    ),
  );
  const [matchStatuses, setMatchStatuses] = useState<
    Record<string, MatchStatus>
  >(() => Object.fromEntries(event.matches.map((m) => [m.id, m.status])));
  const [lastScored, setLastScored] = useState<Record<string, "a" | "b">>({});
  const [eventStatus, setEventStatus] = useState<EventStatus>(event.status);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [joined, setJoined] = useState(initialJoined);
  const [joinLoading, setJoinLoading] = useState(false);

  const participantIds = new Set(event.participants.map((p) => p.id));
  const addableTeams = teamsInSport.filter((t) => !participantIds.has(t.id));
  const isEventDone =
    eventStatus === "COMPLETED" || eventStatus === "CANCELLED";

  function flash(type: "ok" | "err", msg: string) {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3500);
  }
  function act(
    fn: () => Promise<{ success: boolean; message?: string }>,
    onSuccess?: () => void,
  ) {
    start(async () => {
      const res = await fn();
      if (res.success) onSuccess?.();
      else flash("err", res.message ?? "Something went wrong");
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Flash notice */}
      {notice && (
        <div
          className={`sp-notice ${notice.type === "ok" ? "sp-notice-ok" : "sp-notice-err"}`}
        >
          {notice.msg}
        </div>
      )}

      {/* Edit score modal */}
      {editingMatch && (
        <EditScoreModal
          match={editingMatch}
          eventId={event.id}
          scoreA={scores[editingMatch.id]?.a ?? editingMatch.score_team_a}
          scoreB={scores[editingMatch.id]?.b ?? editingMatch.score_team_b}
          onClose={() => setEditingMatch(null)}
          onSaved={(a, b) => {
            setScores((p) => ({ ...p, [editingMatch.id]: { a, b } }));
            flash("ok", "Score updated.");
          }}
        />
      )}

      {/* ── Join / Leave (non-managers only) ─────────────────────────────── */}
      {!isOrganizer && (
        <div
          className="sp-card"
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>
              Participation
            </p>
            <p
              style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}
            >
              {joined
                ? "You are registered for this event."
                : isEventDone
                  ? "This event is no longer accepting registrations."
                  : hasPlayerProfile
                    ? "Join this event to participate."
                    : "Set up your player profile to join events."}
            </p>
          </div>
          {!isEventDone &&
            (joined ? (
              <button
                disabled={joinLoading}
                onClick={async () => {
                  setJoinLoading(true);
                  const res = await leaveEvent(event.id);
                  if (res.success) {
                    setJoined(false);
                    flash("ok", "You have left the event.");
                  } else flash("err", res.message ?? "Failed.");
                  setJoinLoading(false);
                }}
                className="sp-btn-danger"
                style={{ flexShrink: 0 }}
              >
                {joinLoading ? "Leaving…" : "Leave Event"}
              </button>
            ) : hasPlayerProfile ? (
              <button
                disabled={joinLoading}
                onClick={async () => {
                  setJoinLoading(true);
                  const res = await joinEvent(event.id);
                  if (res.success) {
                    setJoined(true);
                    flash("ok", "You joined the event!");
                  } else flash("err", res.message ?? "Failed.");
                  setJoinLoading(false);
                }}
                className="sp-btn-primary"
                style={{ flexShrink: 0 }}
              >
                {joinLoading ? "Joining…" : "Join Event"}
              </button>
            ) : (
              <a
                href="/dashboard/profile"
                className="sp-btn-secondary"
                style={{ flexShrink: 0, fontSize: "0.8125rem" }}
              >
                Set Up Profile →
              </a>
            ))}
        </div>
      )}

      {/* ── Organizer: Event status ───────────────────────────────────────── */}
      {canManage && (
        <div className="sp-card" style={{ padding: "20px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>Event Status</p>
            <span className={`badge ${STATUS_BADGE[eventStatus]}`}>
              {eventStatus}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"] as const).map(
              (s) => (
                <button
                  key={s}
                  disabled={pending || eventStatus === s}
                  onClick={() =>
                    act(
                      () => updateEventStatus(event.id, s),
                      () => setEventStatus(s),
                    )
                  }
                  className={
                    eventStatus === s ? "sp-btn-primary" : "sp-btn-secondary"
                  }
                  style={{
                    fontSize: "0.8rem",
                    padding: "7px 14px",
                    opacity: eventStatus === s ? 1 : undefined,
                  }}
                >
                  {s}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {/* ── Teams / Participants ──────────────────────────────────────────── */}
      {isTeamSport && (
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
              Teams
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                }}
              >
                ({event.participants.length})
              </span>
            </h2>
            {canManage && !isEventDone && (
              <button
                onClick={() => setShowAddTeam((v) => !v)}
                className="sp-btn-secondary"
                style={{ fontSize: "0.8125rem", padding: "7px 14px" }}
              >
                {showAddTeam ? "Cancel" : "+ Add Team"}
              </button>
            )}
          </div>

          {showAddTeam && addableTeams.length > 0 && (
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                gap: 10,
              }}
            >
              <select
                ref={addTeamRef}
                className="sp-select"
                style={{ flex: 1 }}
              >
                {addableTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                disabled={pending}
                onClick={() => {
                  const id = addTeamRef.current?.value;
                  if (!id) return;
                  act(
                    () => addTeamToEvent(event.id, id),
                    () => {
                      setShowAddTeam(false);
                      flash("ok", "Team added. Reload to see it.");
                    },
                  );
                }}
                className="sp-btn-primary"
                style={{ padding: "10px 18px" }}
              >
                Add
              </button>
            </div>
          )}
          {showAddTeam && addableTeams.length === 0 && (
            <p
              style={{
                padding: "14px 24px",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              All eligible teams are already added.
            </p>
          )}

          {event.participants.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "2rem", marginBottom: 10 }}>👥</p>
              <p
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                {canManage
                  ? "No teams yet — add some above."
                  : "No teams participating."}
              </p>
            </div>
          ) : (
            event.participants.map((team) => (
              <div
                key={team.id}
                className="sp-list-item"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="sp-avatar" style={{ width: 36, height: 36 }}>
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {team.name}
                  </p>
                  <p
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    {team._count.members} member
                    {team._count.members !== 1 ? "s" : ""}
                  </p>
                </div>
                {canManage && !isEventDone && (
                  <button
                    disabled={pending}
                    onClick={() =>
                      act(
                        () => removeTeamFromEvent(event.id, team.id),
                        () => flash("ok", "Team removed."),
                      )
                    }
                    className="sp-btn-danger"
                    style={{ fontSize: "0.75rem", padding: "5px 10px" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {/* ── Participants (individual sport) ───────────────────────────────── */}
      {!isTeamSport && (
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
              Participants
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                }}
              >
                ({event.players.length})
              </span>
            </h2>
          </div>
          {event.players.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "2rem", marginBottom: 10 }}>👥</p>
              <p
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                {canManage ? "No participants yet." : "Be the first to join!"}
              </p>
            </div>
          ) : (
            event.players.map((p) => (
              <div
                key={p.id}
                className="sp-list-item"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div
                  className="sp-avatar"
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(251,191,36,0.12)",
                    color: "#fbbf24",
                  }}
                >
                  {p.first_name[0]}
                  {p.last_name[0]}
                </div>
                <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  {p.first_name} {p.last_name}
                  {p.id === currentUserId && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      (you)
                    </span>
                  )}
                </p>
              </div>
            ))
          )}
        </section>
      )}

      {/* ── Attendees (team sport join) ───────────────────────────────────── */}
      {isTeamSport && event.players.length > 0 && (
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
                  background: "#fbbf24",
                  borderRadius: 3,
                  display: "inline-block",
                }}
              />
              Attendees
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                }}
              >
                ({event.players.length})
              </span>
            </h2>
          </div>
          {event.players.map((p) => (
            <div
              key={p.id}
              className="sp-list-item"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div
                className="sp-avatar"
                style={{
                  width: 34,
                  height: 34,
                  background: "rgba(251,191,36,0.1)",
                  color: "#fbbf24",
                  borderRadius: 9,
                }}
              >
                {p.first_name[0]}
                {p.last_name[0]}
              </div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                {p.first_name} {p.last_name}
                {p.id === currentUserId && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    (you)
                  </span>
                )}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* ── Matches ───────────────────────────────────────────────────────── */}
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
                background: "#c084fc",
                borderRadius: 3,
                display: "inline-block",
              }}
            />
            Matches
            <span
              style={{
                fontWeight: 400,
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
              }}
            >
              ({event.matches.length})
            </span>
          </h2>
          {canManage && !isEventDone && (
            <button
              onClick={() => setShowAddMatch((v) => !v)}
              className="sp-btn-secondary"
              style={{ fontSize: "0.8125rem", padding: "7px 14px" }}
            >
              {showAddMatch ? "Cancel" : "+ Add Match"}
            </button>
          )}
        </div>

        {showAddMatch && (
          <AddMatchForm
            eventId={event.id}
            teamsInSport={teamsInSport}
            participants={event.participants}
            players={event.players}
            isTeamSport={isTeamSport}
            onAdded={() => {
              setShowAddMatch(false);
              flash("ok", "Match added. Reload to see it.");
            }}
          />
        )}

        {event.matches.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: 10 }}>🏟</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {canManage
                ? 'No matches yet — click "+ Add Match" to create one.'
                : "No matches scheduled yet."}
            </p>
          </div>
        ) : (
          event.matches.map((match) => {
            const score = scores[match.id] ?? {
              a: match.score_team_a,
              b: match.score_team_b,
            };
            const status = matchStatuses[match.id] ?? match.status;
            const isLive = status === "ONGOING";
            const isDone = status === "COMPLETED" || status === "CANCELLED";
            const nameA = sideName(match.team_a, match.player_a);
            const nameB = sideName(match.team_b, match.player_b);
            const initA = sideInitials(match.team_a, match.player_a);
            const initB = sideInitials(match.team_b, match.player_b);
            const winner =
              status === "COMPLETED"
                ? score.a > score.b
                  ? nameA
                  : score.b > score.a
                    ? nameB
                    : "Draw"
                : null;

            return (
              <div
                key={match.id}
                style={{
                  padding: "20px 24px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                {/* Match header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      className={`badge ${STATUS_BADGE[status]}`}
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      {isLive && (
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
                      {status}
                    </span>
                    <span className="badge badge-zinc">{match.match_type}</span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {new Date(match.match_date).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                  {winner && (
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--accent)",
                        fontWeight: 700,
                      }}
                    >
                      {winner === "Draw" ? "Draw" : `🏆 ${winner}`}
                    </span>
                  )}
                </div>

                {/* Scoreboard */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  {/* Side A */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      className="sp-avatar"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        flexShrink: 0,
                      }}
                    >
                      {initA}
                    </div>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {nameA}
                    </p>
                  </div>
                  {/* Score */}
                  <div style={{ textAlign: "center", minWidth: 80 }}>
                    <p
                      style={{
                        fontSize: "2rem",
                        fontWeight: 900,
                        lineHeight: 1,
                        color: "var(--text-primary)",
                      }}
                    >
                      {score.a}{" "}
                      <span
                        style={{ color: "var(--text-muted)", fontWeight: 400 }}
                      >
                        –
                      </span>{" "}
                      {score.b}
                    </p>
                  </div>
                  {/* Side B */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      justifyContent: "flex-end",
                    }}
                  >
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        lineHeight: 1.3,
                        textAlign: "right",
                      }}
                    >
                      {nameB}
                    </p>
                    <div
                      className="sp-avatar"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        flexShrink: 0,
                      }}
                    >
                      {initB}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canManage && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {status === "SCHEDULED" && (
                      <button
                        disabled={pending}
                        onClick={() =>
                          act(
                            () => startMatch(match.id, event.id),
                            () =>
                              setMatchStatuses((p) => ({
                                ...p,
                                [match.id]: "ONGOING",
                              })),
                          )
                        }
                        className="sp-btn-primary"
                        style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                      >
                        ▶ Start
                      </button>
                    )}
                    {isLive && (
                      <>
                        <button
                          disabled={pending}
                          onClick={() =>
                            act(
                              () => scoreGoal(match.id, event.id, "a"),
                              () => {
                                setScores((p) => ({
                                  ...p,
                                  [match.id]: {
                                    ...p[match.id],
                                    a: p[match.id].a + 1,
                                  },
                                }));
                                setLastScored((p) => ({
                                  ...p,
                                  [match.id]: "a",
                                }));
                              },
                            )
                          }
                          className="sp-btn-secondary"
                          style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                        >
                          +1 {nameA}
                        </button>
                        <button
                          disabled={pending}
                          onClick={() =>
                            act(
                              () => scoreGoal(match.id, event.id, "b"),
                              () => {
                                setScores((p) => ({
                                  ...p,
                                  [match.id]: {
                                    ...p[match.id],
                                    b: p[match.id].b + 1,
                                  },
                                }));
                                setLastScored((p) => ({
                                  ...p,
                                  [match.id]: "b",
                                }));
                              },
                            )
                          }
                          className="sp-btn-secondary"
                          style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                        >
                          +1 {nameB}
                        </button>
                        <button
                          disabled={pending || !lastScored[match.id]}
                          onClick={() => {
                            const t = lastScored[match.id];
                            if (!t) return;
                            act(
                              () => undoScore(match.id, event.id, t),
                              () => {
                                setScores((p) => ({
                                  ...p,
                                  [match.id]: {
                                    ...p[match.id],
                                    [t]: Math.max(0, p[match.id][t] - 1),
                                  },
                                }));
                                setLastScored((p) => {
                                  const n = { ...p };
                                  delete n[match.id];
                                  return n;
                                });
                                flash("ok", "Last goal undone.");
                              },
                            );
                          }}
                          className="sp-btn-ghost"
                          style={{ fontSize: "0.78rem", padding: "6px 12px" }}
                        >
                          Undo
                        </button>
                        <button
                          disabled={pending}
                          onClick={() =>
                            act(
                              () => completeMatch(match.id, event.id),
                              () =>
                                setMatchStatuses((p) => ({
                                  ...p,
                                  [match.id]: "COMPLETED",
                                })),
                            )
                          }
                          className="sp-btn-primary"
                          style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                        >
                          ✓ Complete
                        </button>
                      </>
                    )}
                    {!isDone && (
                      <button
                        onClick={() => setEditingMatch(match)}
                        className="sp-btn-secondary"
                        style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                      >
                        Edit Score
                      </button>
                    )}
                    {!isDone && (
                      <button
                        disabled={pending}
                        onClick={() =>
                          act(
                            () => cancelMatch(match.id, event.id),
                            () =>
                              setMatchStatuses((p) => ({
                                ...p,
                                [match.id]: "CANCELLED",
                              })),
                          )
                        }
                        className="sp-btn-danger"
                        style={{ fontSize: "0.78rem", padding: "6px 12px" }}
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
