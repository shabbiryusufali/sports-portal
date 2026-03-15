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
type ResultType = "NORMAL" | "OVERTIME" | "TIEBREAKER";

type Match = {
  id: string;
  status: MatchStatus;
  match_type: "FRIENDLY" | "TOURNAMENT";
  match_date: string;
  score_team_a: number;
  score_team_b: number;
  result_type?: ResultType;
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
      <div className="sp-card" style={{ padding: 28, width: "100%", maxWidth: 360 }}>
        <p style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 20 }}>
          Edit Score
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 16, textAlign: "center" }}>
          {sideName(match.team_a, match.player_a)} vs{" "}
          {sideName(match.team_b, match.player_b)}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 24 }}>
          <input
            type="number"
            min={0}
            value={a}
            onChange={(e) => setA(+e.target.value)}
            className="sp-input"
            style={{ width: 80, textAlign: "center", fontSize: "1.5rem", fontWeight: 900 }}
          />
          <span style={{ fontSize: "1.25rem", color: "var(--text-muted)", fontWeight: 700 }}>–</span>
          <input
            type="number"
            min={0}
            value={b}
            onChange={(e) => setB(+e.target.value)}
            className="sp-input"
            style={{ width: 80, textAlign: "center", fontSize: "1.5rem", fontWeight: 900 }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} disabled={pending} className="sp-btn-primary" style={{ flex: 1 }}>
            {pending ? "Saving…" : "Save Score"}
          </button>
          <button onClick={onClose} className="sp-btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Complete Match Modal ──────────────────────────────────────────────────────

function CompleteMatchModal({
  match,
  eventId,
  nameA,
  nameB,
  score,
  onClose,
  onCompleted,
}: {
  match: Match;
  eventId: string;
  nameA: string;
  nameB: string;
  score: { a: number; b: number };
  onClose: () => void;
  onCompleted: (resultType: ResultType) => void;
}) {
  const [pending, start] = useTransition();
  const isTied = score.a === score.b;

  function complete(resultType: ResultType) {
    start(async () => {
      const res = await completeMatch(match.id, eventId, resultType);
      if (res.success) onCompleted(resultType);
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
      <div className="sp-card" style={{ padding: 28, width: "100%", maxWidth: 400 }}>
        <p style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 6 }}>Complete Match</p>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 20 }}>
          {nameA} <strong style={{ color: "var(--text-primary)" }}>{score.a}</strong>
          {" – "}
          <strong style={{ color: "var(--text-primary)" }}>{score.b}</strong> {nameB}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            disabled={pending}
            onClick={() => complete("NORMAL")}
            className="sp-btn-primary"
            style={{ justifyContent: "center" }}
          >
            ✓ Normal Result
            <span style={{ fontWeight: 400, fontSize: "0.78rem", color: "rgba(0,0,0,0.6)", marginLeft: 6 }}>
              (W=3pts, L=0pts)
            </span>
          </button>

          <button
            disabled={pending}
            onClick={() => complete("OVERTIME")}
            className="sp-btn-secondary"
            style={{ justifyContent: "center" }}
          >
            ⏱ Overtime / Extra Time
            <span style={{ fontWeight: 400, fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: 6 }}>
              (W=2pts, L=1pt)
            </span>
          </button>

          <button
            disabled={pending}
            onClick={() => complete("TIEBREAKER")}
            className="sp-btn-secondary"
            style={{ justifyContent: "center" }}
          >
            🔢 Tiebreaker / Game 3
            <span style={{ fontWeight: 400, fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: 6 }}>
              (W=2pts, L=1pt)
            </span>
          </button>

          {isTied && (
            <p style={{ fontSize: "0.75rem", color: "#fbbf24", textAlign: "center", marginTop: 4 }}>
              ⚠ Scores are tied — make sure the correct winner has the higher score before completing.
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="sp-btn-ghost"
          style={{ width: "100%", marginTop: 16, justifyContent: "center" }}
        >
          Cancel
        </button>
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
    : players.map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` }));

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

      {/* Side A / Side B — stack on small screens */}
      <div className="sp-grid-2">
        <div>
          <label className="sp-label">{isTeamSport ? "Team A" : "Player A"}</label>
          <select name="side_a" required className="sp-input" style={{ appearance: "auto" }}>
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="sp-label">{isTeamSport ? "Team B" : "Player B"}</label>
          <select name="side_b" required className="sp-input" style={{ appearance: "auto" }}>
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date + Type — stack on small screens */}
      <div className="sp-grid-2">
        <div>
          <label className="sp-label">Match Date &amp; Time</label>
          <input
            name="match_date"
            type="datetime-local"
            required
            className="sp-input"
          />
        </div>
        <div>
          <label className="sp-label">Match Type</label>
          <select name="match_type" className="sp-input" style={{ appearance: "auto" }}>
            <option value="FRIENDLY">Friendly</option>
            <option value="TOURNAMENT">Tournament</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="sp-btn-primary"
        style={{ fontSize: "0.78rem", padding: "6px 14px", alignSelf: "flex-start" }}
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
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const addTeamRef = useRef<HTMLSelectElement>(null);

  const [scores, setScores] = useState<Record<string, { a: number; b: number }>>(() =>
    Object.fromEntries(
      event.matches.map((m) => [m.id, { a: m.score_team_a, b: m.score_team_b }]),
    ),
  );
  const [matchStatuses, setMatchStatuses] = useState<Record<string, MatchStatus>>(() =>
    Object.fromEntries(event.matches.map((m) => [m.id, m.status])),
  );
  const [eventStatus, setEventStatus] = useState<EventStatus>(event.status);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [completingMatch, setCompletingMatch] = useState<Match | null>(null);
  const [joined, setJoined] = useState(initialJoined);
  const [joinLoading, setJoinLoading] = useState(false);

  const participantIds = new Set(event.participants.map((p) => p.id));
  const addableTeams = teamsInSport.filter((t) => !participantIds.has(t.id));
  const isEventDone = eventStatus === "COMPLETED" || eventStatus === "CANCELLED";

  function flash(type: "ok" | "err", msg: string) {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3500);
  }
  function act(fn: () => Promise<{ success: boolean; message?: string }>, onSuccess?: () => void) {
    start(async () => {
      const res = await fn();
      if (res.success) onSuccess?.();
      else flash("err", res.message ?? "Something went wrong");
    });
  }

  // Safe score getter — always returns a valid {a, b} even for newly-added matches
  function getScore(matchId: string, fallbackA = 0, fallbackB = 0) {
    return scores[matchId] ?? { a: fallbackA, b: fallbackB };
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {notice && (
        <div className={`sp-notice ${notice.type === "ok" ? "sp-notice-ok" : "sp-notice-err"}`}>
          {notice.msg}
        </div>
      )}

      {/* Edit score modal */}
      {editingMatch && (
        <EditScoreModal
          match={editingMatch}
          eventId={event.id}
          scoreA={getScore(editingMatch.id, editingMatch.score_team_a, editingMatch.score_team_b).a}
          scoreB={getScore(editingMatch.id, editingMatch.score_team_a, editingMatch.score_team_b).b}
          onClose={() => setEditingMatch(null)}
          onSaved={(a, b) => {
            setScores((p) => ({ ...p, [editingMatch.id]: { a, b } }));
            flash("ok", "Score updated.");
          }}
        />
      )}

      {/* Complete match modal */}
      {completingMatch && (
        <CompleteMatchModal
          match={completingMatch}
          eventId={event.id}
          nameA={sideName(completingMatch.team_a, completingMatch.player_a)}
          nameB={sideName(completingMatch.team_b, completingMatch.player_b)}
          score={getScore(completingMatch.id, completingMatch.score_team_a, completingMatch.score_team_b)}
          onClose={() => setCompletingMatch(null)}
          onCompleted={() =>
            setMatchStatuses((p) => ({ ...p, [completingMatch.id]: "COMPLETED" }))
          }
        />
      )}

      {/* ── Join / Leave ──────────────────────────────────────────────────── */}
      {!isOrganizer && (
        <div
          className="sp-card"
          style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}
        >
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>Participation</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
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
                  if (res.success) { setJoined(false); flash("ok", "You have left the event."); }
                  else flash("err", res.message ?? "Failed.");
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
                  if (res.success) { setJoined(true); flash("ok", "You joined the event!"); }
                  else flash("err", res.message ?? "Failed.");
                  setJoinLoading(false);
                }}
                className="sp-btn-primary"
                style={{ flexShrink: 0 }}
              >
                {joinLoading ? "Joining…" : "Join Event"}
              </button>
            ) : null)}
        </div>
      )}

      {/* ── Event status controls ─────────────────────────────────────────── */}
      {canManage && (
        <div className="sp-card" style={{ padding: "20px 24px" }}>
          <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 14 }}>Event Status</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"] as EventStatus[]).map((s) => (
              <button
                key={s}
                disabled={pending || eventStatus === s}
                onClick={() =>
                  act(
                    () => updateEventStatus(event.id, s),
                    () => setEventStatus(s),
                  )
                }
                className={eventStatus === s ? "sp-btn-primary" : "sp-btn-secondary"}
                style={{ fontSize: "0.78rem", padding: "6px 14px" }}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Participants ──────────────────────────────────────────────────── */}
      {isTeamSport && (
        <section className="sp-card" style={{ overflow: "hidden" }}>
          <div className="sp-card-header">
            <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 18, background: "#60a5fa", borderRadius: 3, display: "inline-block" }} />
              Participating Teams
              <span style={{ fontWeight: 400, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                ({event.participants.length})
              </span>
            </h2>
            {canManage && !isEventDone && addableTeams.length > 0 && (
              <button
                onClick={() => setShowAddTeam((v) => !v)}
                className="sp-btn-secondary"
                style={{ fontSize: "0.8125rem", padding: "7px 14px" }}
              >
                {showAddTeam ? "Cancel" : "+ Add Team"}
              </button>
            )}
          </div>

          {showAddTeam && (
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select ref={addTeamRef} className="sp-input" style={{ flex: 1, appearance: "auto", minWidth: 160 }}>
                {addableTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button
                disabled={pending}
                onClick={() => {
                  const id = addTeamRef.current?.value;
                  if (!id) return;
                  act(
                    () => addTeamToEvent(event.id, id),
                    () => { setShowAddTeam(false); flash("ok", "Team added. Reload to see changes."); },
                  );
                }}
                className="sp-btn-primary"
                style={{ fontSize: "0.875rem", padding: "8px 16px" }}
              >
                Add
              </button>
            </div>
          )}

          {event.participants.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>No teams registered yet.</p>
            </div>
          ) : (
            event.participants.map((team, i) => (
              <div
                key={team.id}
                className="sp-list-item"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="sp-avatar" style={{ width: 32, height: 32, fontSize: "0.7rem" }}>
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{team.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {canManage && !isEventDone && (
                  <button
                    disabled={pending}
                    onClick={() =>
                      act(
                        () => removeTeamFromEvent(event.id, team.id),
                        () => flash("ok", "Team removed. Reload to see changes."),
                      )
                    }
                    className="sp-btn-ghost"
                    style={{ fontSize: "0.78rem", padding: "4px 10px", color: "#f87171" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {/* ── Matches ───────────────────────────────────────────────────────── */}
      <section className="sp-card" style={{ overflow: "hidden" }}>
        <div className="sp-card-header">
          <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 18, background: "#c084fc", borderRadius: 3, display: "inline-block" }} />
            Matches
            <span style={{ fontWeight: 400, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
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
              flash("ok", "Match added — reload the page to see it.");
            }}
          />
        )}

        {event.matches.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: 10 }}>🏟</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {canManage ? 'No matches yet — click "+ Add Match" to create one.' : "No matches scheduled yet."}
            </p>
          </div>
        ) : (
          event.matches.map((match) => {
            const score = getScore(match.id, match.score_team_a, match.score_team_b);
            const status = matchStatuses[match.id] ?? match.status;
            const isLive = status === "ONGOING";
            const isDone = status === "COMPLETED" || status === "CANCELLED";
            const nameA = sideName(match.team_a, match.player_a);
            const nameB = sideName(match.team_b, match.player_b);
            const initA = sideInitials(match.team_a, match.player_a);
            const initB = sideInitials(match.team_b, match.player_b);
            const winner =
              status === "COMPLETED"
                ? score.a > score.b ? nameA : score.b > score.a ? nameB : null
                : null;

            return (
              <div
                key={match.id}
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* Score row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {/* Side A */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 100 }}>
                    <div className="sp-avatar" style={{ width: 30, height: 30, fontSize: "0.65rem", flexShrink: 0 }}>
                      {initA}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {nameA}
                      {winner === nameA && <span style={{ marginLeft: 6, fontSize: "0.75rem", color: "var(--accent)" }}>★</span>}
                    </span>
                  </div>

                  {/* Score */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: "1.375rem", fontWeight: 900, minWidth: 28, textAlign: "center", color: score.a > score.b && isDone ? "var(--accent)" : "var(--text-primary)" }}>
                      {score.a}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>–</span>
                    <span style={{ fontSize: "1.375rem", fontWeight: 900, minWidth: 28, textAlign: "center", color: score.b > score.a && isDone ? "var(--accent)" : "var(--text-primary)" }}>
                      {score.b}
                    </span>
                  </div>

                  {/* Side B */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 100, justifyContent: "flex-end" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                      {winner === nameB && <span style={{ marginRight: 6, fontSize: "0.75rem", color: "var(--accent)" }}>★</span>}
                      {nameB}
                    </span>
                    <div className="sp-avatar" style={{ width: 30, height: 30, fontSize: "0.65rem", flexShrink: 0 }}>
                      {initB}
                    </div>
                  </div>
                </div>

                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className={`badge ${STATUS_BADGE[status]}`}>{status}</span>
                  {match.result_type && match.result_type !== "NORMAL" && status === "COMPLETED" && (
                    <span className="badge badge-purple">
                      {match.result_type === "OVERTIME" ? "OT" : "Tiebreaker"}
                    </span>
                  )}
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {new Date(match.match_date).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={`badge ${match.match_type === "TOURNAMENT" ? "badge-amber" : "badge-zinc"}`}>
                    {match.match_type}
                  </span>
                </div>

                {/* Action buttons */}
                {canManage && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {/* Start */}
                    {status === "SCHEDULED" && (
                      <button
                        disabled={pending}
                        onClick={() =>
                          act(
                            () => startMatch(match.id, event.id),
                            () => {
                              setMatchStatuses((p) => ({ ...p, [match.id]: "ONGOING" }));
                              // Ensure score entry exists
                              setScores((p) => ({
                                ...p,
                                [match.id]: p[match.id] ?? { a: match.score_team_a, b: match.score_team_b },
                              }));
                            },
                          )
                        }
                        className="sp-btn-primary"
                        style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                      >
                        ▶ Start
                      </button>
                    )}

                    {/* Live scoring controls */}
                    {isLive && (
                      <>
                        {/* +1 / -1 for A */}
                        <button
                          disabled={pending}
                          onClick={() =>
                            act(
                              () => scoreGoal(match.id, event.id, "a"),
                              () =>
                                setScores((p) => ({
                                  ...p,
                                  [match.id]: {
                                    a: (p[match.id]?.a ?? 0) + 1,
                                    b: p[match.id]?.b ?? 0,
                                  },
                                })),
                            )
                          }
                          className="sp-btn-secondary"
                          style={{ fontSize: "0.78rem", padding: "6px 12px" }}
                        >
                          +1 {nameA}
                        </button>
                        <button
                          disabled={pending || (score.a <= 0)}
                          onClick={() =>
                            act(
                              () => undoScore(match.id, event.id, "a"),
                              () =>
                                setScores((p) => ({
                                  ...p,
                                  [match.id]: {
                                    a: Math.max(0, (p[match.id]?.a ?? 0) - 1),
                                    b: p[match.id]?.b ?? 0,
                                  },
                                })),
                            )
                          }
                          className="sp-btn-ghost"
                          style={{ fontSize: "0.78rem", padding: "6px 10px" }}
                          title={`Remove 1 from ${nameA}`}
                        >
                          −1
                        </button>

                        <span style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 2px" }} />

                        {/* +1 / -1 for B */}
                        <button
                          disabled={pending}
                          onClick={() =>
                            act(
                              () => scoreGoal(match.id, event.id, "b"),
                              () =>
                                setScores((p) => ({
                                  ...p,
                                  [match.id]: {
                                    a: p[match.id]?.a ?? 0,
                                    b: (p[match.id]?.b ?? 0) + 1,
                                  },
                                })),
                            )
                          }
                          className="sp-btn-secondary"
                          style={{ fontSize: "0.78rem", padding: "6px 12px" }}
                        >
                          +1 {nameB}
                        </button>
                        <button
                          disabled={pending || (score.b <= 0)}
                          onClick={() =>
                            act(
                              () => undoScore(match.id, event.id, "b"),
                              () =>
                                setScores((p) => ({
                                  ...p,
                                  [match.id]: {
                                    a: p[match.id]?.a ?? 0,
                                    b: Math.max(0, (p[match.id]?.b ?? 0) - 1),
                                  },
                                })),
                            )
                          }
                          className="sp-btn-ghost"
                          style={{ fontSize: "0.78rem", padding: "6px 10px" }}
                          title={`Remove 1 from ${nameB}`}
                        >
                          −1
                        </button>

                        <span style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 2px" }} />

                        {/* Complete (opens modal) */}
                        <button
                          disabled={pending}
                          onClick={() => setCompletingMatch(match)}
                          className="sp-btn-primary"
                          style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                        >
                          ✓ Complete…
                        </button>
                      </>
                    )}

                    {/* Edit Score (pre-complete) */}
                    {!isDone && (
                      <button
                        onClick={() => setEditingMatch(match)}
                        className="sp-btn-secondary"
                        style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                      >
                        Edit Score
                      </button>
                    )}

                    {/* Cancel */}
                    {!isDone && (
                      <button
                        disabled={pending}
                        onClick={() =>
                          act(
                            () => cancelMatch(match.id, event.id),
                            () => setMatchStatuses((p) => ({ ...p, [match.id]: "CANCELLED" })),
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