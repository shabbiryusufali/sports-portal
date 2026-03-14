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
  team_a: Team;
  team_b: Team;
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
}

// ── Shared input style ────────────────────────────────────────────────────────

const input =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#00ff87]/50 transition";

// ── Edit Score Modal ──────────────────────────────────────────────────────────

function EditScoreModal({
  match,
  eventId,
  scoreA,
  scoreB,
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
  const [a, setA] = useState(String(scoreA));
  const [b, setB] = useState(String(scoreB));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  const valid = !isNaN(numA) && !isNaN(numB) && numA >= 0 && numB >= 0;

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    setErr(null);
    const res = await setScore(match.id, eventId, numA, numB);
    if (res.success) {
      onSaved(numA, numB);
      onClose();
    } else {
      setErr(res.message ?? "Failed to update score.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white">Edit Score</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-5">
          <div className="text-center">
            <p className="text-xs font-semibold text-zinc-400 mb-2 truncate">{match.team_a.name}</p>
            <input
              type="number" min={0} value={a}
              onChange={(e) => setA(e.target.value)}
              className="w-full text-center text-3xl font-black bg-zinc-800 border border-zinc-700 rounded-xl py-2 text-white focus:outline-none focus:border-[#00ff87] tabular-nums"
            />
          </div>
          <span className="text-zinc-600 font-bold text-xl pt-5">:</span>
          <div className="text-center">
            <p className="text-xs font-semibold text-zinc-400 mb-2 truncate">{match.team_b.name}</p>
            <input
              type="number" min={0} value={b}
              onChange={(e) => setB(e.target.value)}
              className="w-full text-center text-3xl font-black bg-zinc-800 border border-zinc-700 rounded-xl py-2 text-white focus:outline-none focus:border-[#00ff87] tabular-nums"
            />
          </div>
        </div>

        {err && (
          <p className="text-red-400 text-xs mb-4 bg-red-900/20 border border-red-700/40 px-3 py-2 rounded-lg">{err}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm py-2.5 rounded-xl transition">
            Cancel
          </button>
          <button
            disabled={!valid || saving}
            onClick={handleSave}
            className="flex-1 bg-[#00ff87] text-zinc-900 font-bold text-sm py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Score"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Match Form ────────────────────────────────────────────────────────────

function AddMatchForm({
  eventId,
  participants,
  participantLabel = "teams",
  onAdded,
}: {
  eventId: string;
  participants: Team[];
  participantLabel?: string;
  onAdded: () => void;
}) {
  const [, start] = useTransition();
  const [teamA, setTeamA] = useState(participants[0]?.id ?? "");
  const [teamB, setTeamB] = useState(participants[1]?.id ?? "");
  const [matchDate, setMatchDate] = useState("");
  const [matchType, setMatchType] = useState<"FRIENDLY" | "TOURNAMENT">("FRIENDLY");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleAdd() {
    if (!teamA || !teamB || teamA === teamB) {
      setErr("Please select two different teams.");
      return;
    }
    setErr(null);
    setLoading(true);
    const res = await addMatch(eventId, {
      teamAId: teamA,
      teamBId: teamB,
      matchDate,
      matchType,
    });
    setLoading(false);
    if (res.success) {
      onAdded();
    } else {
      setErr(res.message ?? "Failed to add match.");
    }
  }

  if (participants.length < 2) {
    return (
      <p className="text-zinc-500 text-sm">
        At least 2 {participantLabel} are needed to create a match.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-zinc-300">New Match</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Team A</label>
          <select value={teamA} onChange={(e) => setTeamA(e.target.value)} className={input}>
            {participants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Team B</label>
          <select value={teamB} onChange={(e) => setTeamB(e.target.value)} className={input}>
            {participants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Date & Time</label>
          <input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className={input} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Type</label>
          <select value={matchType} onChange={(e) => setMatchType(e.target.value as any)} className={input}>
            <option value="FRIENDLY">Friendly</option>
            <option value="TOURNAMENT">Tournament</option>
          </select>
        </div>
      </div>

      {teamA === teamB && teamA && (
        <p className="text-amber-400 text-xs">Teams must be different.</p>
      )}
      {err && <p className="text-red-400 text-xs">{err}</p>}

      <button
        disabled={loading || !teamA || !teamB || teamA === teamB}
        onClick={handleAdd}
        className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl text-sm hover:bg-[#00e87a] transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Adding…" : "Add Match"}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EventClient({ event, canManage, teamsInSport, hasPlayerProfile, isJoined: initialJoined, currentUserId, isTeamSport }: Props) {
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const addTeamRef = useRef<HTMLSelectElement>(null);

  const [scores, setScores] = useState<Record<string, { a: number; b: number }>>(() =>
    Object.fromEntries(event.matches.map((m) => [m.id, { a: m.score_team_a, b: m.score_team_b }]))
  );
  const [matchStatuses, setMatchStatuses] = useState<Record<string, MatchStatus>>(() =>
    Object.fromEntries(event.matches.map((m) => [m.id, m.status]))
  );
  const [eventStatus, setEventStatus] = useState<EventStatus>(event.status);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
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

  // Status badge config
  const statusBadge: Record<EventStatus, string> = {
    SCHEDULED: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    ONGOING:   "text-[#00ff87] bg-[#00ff87]/10 border-[#00ff87]/20",
    COMPLETED: "text-zinc-400 bg-zinc-800 border-zinc-700",
    CANCELLED: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="space-y-6">

      {/* ── Flash notice ─────────────────────────────────────────── */}
      {notice && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${
          notice.type === "ok"
            ? "text-[#00ff87] bg-[#00ff87]/10 border-[#00ff87]/20"
            : "text-red-400 bg-red-500/10 border-red-500/20"
        }`}>
          {notice.msg}
        </div>
      )}

      {/* ── Edit score modal ──────────────────────────────────────── */}
      {editingMatch && (
        <EditScoreModal
          match={editingMatch}
          eventId={event.id}
          scoreA={scores[editingMatch.id]?.a ?? editingMatch.score_team_a}
          scoreB={scores[editingMatch.id]?.b ?? editingMatch.score_team_b}
          onClose={() => setEditingMatch(null)}
          onSaved={(a, b) => {
            setScores((prev) => ({ ...prev, [editingMatch.id]: { a, b } }));
            flash("ok", "Score updated.");
          }}
        />
      )}

      {/* ── Join / Leave Event ───────────────────────────────────────────── */}
      {!canManage && (
        <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-sm flex items-center gap-2 mb-1">
                <span className="w-1.5 h-4 bg-[#00ff87] rounded-full inline-block" />
                Participation
              </h2>
              {joined ? (
                <p className="text-zinc-400 text-sm">You are registered for this event.</p>
              ) : eventStatus === "COMPLETED" || eventStatus === "CANCELLED" ? (
                <p className="text-zinc-500 text-sm">This event is no longer accepting registrations.</p>
              ) : (
                <p className="text-zinc-400 text-sm">
                  {hasPlayerProfile
                    ? "Join this event to participate."
                    : "Set up your player profile to join events."}
                </p>
              )}
            </div>
            {eventStatus !== "COMPLETED" && eventStatus !== "CANCELLED" && (
              joined ? (
                <button
                  disabled={joinLoading}
                  onClick={async () => {
                    setJoinLoading(true);
                    const res = await leaveEvent(event.id);
                    if (res.success) { setJoined(false); flash("ok", "You have left the event."); }
                    else flash("err", res.message ?? "Failed to leave event.");
                    setJoinLoading(false);
                  }}
                  className="shrink-0 text-sm font-semibold text-red-400 border border-red-500/20 px-5 py-2.5 rounded-xl hover:bg-red-500/10 transition disabled:opacity-40"
                >
                  {joinLoading ? "Leaving…" : "Leave Event"}
                </button>
              ) : hasPlayerProfile ? (
                <button
                  disabled={joinLoading}
                  onClick={async () => {
                    setJoinLoading(true);
                    const res = await joinEvent(event.id);
                    if (res.success) { setJoined(true); flash("ok", "You have joined the event!"); }
                    else flash("err", res.message ?? "Failed to join event.");
                    setJoinLoading(false);
                  }}
                  className="shrink-0 bg-[#00ff87] text-zinc-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-40"
                >
                  {joinLoading ? "Joining…" : "Join Event"}
                </button>
              ) : (
                <a href="/dashboard/profile" className="shrink-0 text-sm font-semibold text-amber-400 border border-amber-400/20 px-5 py-2.5 rounded-xl hover:bg-amber-400/10 transition">
                  Set Up Profile →
                </a>
              )
            )}
          </div>
        </section>
      )}

      {/* ── Event Status Controls ─────────────────────────────────── */}
      {canManage && (
        <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <span className="w-1.5 h-4 bg-zinc-400 rounded-full inline-block" />
              Event Status
            </h2>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusBadge[eventStatus]}`}>
              {eventStatus}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"] as const).map((s) => (
              <button
                key={s}
                disabled={pending || eventStatus === s}
                onClick={() => act(() => updateEventStatus(event.id, s), () => setEventStatus(s))}
                className={`text-xs font-semibold px-4 py-2 rounded-lg border transition disabled:cursor-not-allowed ${
                  eventStatus === s
                    ? "bg-[#00ff87]/20 text-[#00ff87] border-[#00ff87]/30 cursor-default"
                    : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 disabled:opacity-40"
                }`}
              >
                {s === "SCHEDULED" && "⏰ "}
                {s === "ONGOING"   && "▶ "}
                {s === "COMPLETED" && "✓ "}
                {s === "CANCELLED" && "✕ "}
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Participants (team-sport: teams; individual: players) ── */}
      {isTeamSport ? 
              /* ── Participating Teams ───────────────────────────────────── */
      
      (
              <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#00ff87] rounded-full inline-block" />
                    Participating Teams
                    <span className="text-zinc-600 font-normal text-sm">({event.participants.length})</span>
                  </h2>
                  {canManage && !isEventDone && addableTeams.length > 0 && (
                    <button
                      onClick={() => setShowAddTeam((v) => !v)}
                      className="text-xs font-semibold text-[#00ff87] bg-[#00ff87]/10 hover:bg-[#00ff87]/20 px-3 py-1.5 rounded-lg transition"
                    >
                      {showAddTeam ? "Cancel" : "+ Add Team"}
                    </button>
                  )}
                </div>
        
                {showAddTeam && (
                  <div className="px-6 py-4 border-b border-white/[0.06] flex gap-3">
                    <select ref={addTeamRef} className={`${input} flex-1`} defaultValue={addableTeams[0]?.id ?? ""}>
                      {addableTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button
                      disabled={pending}
                      onClick={() => {
                        const id = addTeamRef.current?.value;
                        if (!id) return;
                        act(() => addTeamToEvent(event.id, id), () => {
                          flash("ok", "Team added!");
                          setShowAddTeam(false);
                        });
                      }}
                      className="bg-[#00ff87] text-zinc-900 font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                )}
        
                {event.participants.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-4xl mb-3">👥</p>
                    <p className="text-zinc-500 text-sm">
                      {canManage ? "No teams yet — add some above." : "No teams participating."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {event.participants.map((team) => (
                      <div key={team.id} className="flex items-center gap-4 px-6 py-3.5">
                        <div className="w-9 h-9 rounded-xl bg-[#00ff87]/10 flex items-center justify-center font-black text-xs text-[#00ff87] shrink-0">
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{team.name}</p>
                          <p className="text-zinc-600 text-xs">{team._count.members} member{team._count.members !== 1 ? "s" : ""}</p>
                        </div>
                        {canManage && !isEventDone && (
                          <button
                            disabled={pending}
                            onClick={() => act(() => removeTeamFromEvent(event.id, team.id), () => flash("ok", "Team removed."))}
                            className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10 transition disabled:opacity-40"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
        
      ) : (
        <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#00ff87] rounded-full inline-block" />
              Participants
              <span className="text-zinc-600 font-normal text-sm">({event.players.length})</span>
            </h2>
          </div>
          {event.players.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-zinc-500 text-sm">
                {canManage ? "No participants yet." : "Be the first to join!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {event.players.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#00ff87]/10 flex items-center justify-center font-black text-xs text-[#00ff87] shrink-0">
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <span className="text-sm font-medium flex-1">
                    {p.first_name} {p.last_name}
                    {p.id === currentUserId && (
                      <span className="ml-2 text-xs text-zinc-500">(you)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {/* ── Matches ───────────────────────────────────────────────── */}
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-500 rounded-full inline-block" />
            Matches
            <span className="text-zinc-600 font-normal text-sm">({event.matches.length})</span>
          </h2>
          {canManage && !isEventDone && (
            <button
              onClick={() => setShowAddMatch((v) => !v)}
              className="text-xs font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg transition"
            >
              {showAddMatch ? "Cancel" : "+ Add Match"}
            </button>
          )}
        </div>

        {/* Add match form */}
        {showAddMatch && canManage && (
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <AddMatchForm
              eventId={event.id}
              participants={isTeamSport ? event.participants : teamsInSport}
              participantLabel={isTeamSport ? "teams" : "players"}
              onAdded={() => {
                flash("ok", "Match added! Refresh to see it.");
                setShowAddMatch(false);
              }}
            />
          </div>
        )}

        {event.matches.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-4xl mb-3">🏟</p>
            <p className="text-zinc-500 text-sm">
              {canManage
                ? "No matches yet — click \"+ Add Match\" to create one."
                : "No matches scheduled yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {event.matches.map((match) => {
              const score = scores[match.id] ?? { a: match.score_team_a, b: match.score_team_b };
              const status = matchStatuses[match.id] ?? match.status;
              const isOngoing   = status === "ONGOING";
              const isCompleted = status === "COMPLETED";
              const isCancelled = status === "CANCELLED";
              const isDone = isCompleted || isCancelled;
              const canEditScore = canManage && !isCancelled;

              const winner = isCompleted
                ? score.a > score.b ? match.team_a.name
                : score.b > score.a ? match.team_b.name
                : "Draw"
                : null;

              return (
                <div key={match.id} className="p-6">
                  {/* Match header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isOngoing ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#00ff87] bg-[#00ff87]/10 px-3 py-1.5 rounded-full border border-[#00ff87]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                          isCompleted ? "text-zinc-400 bg-zinc-800 border-zinc-700" :
                          isCancelled ? "text-red-400 bg-red-500/10 border-red-500/20" :
                          "text-blue-400 bg-blue-500/10 border-blue-500/20"
                        }`}>
                          {status}
                        </span>
                      )}
                      <span className="text-xs text-zinc-600 font-medium">{match.match_type}</span>
                      {match.match_date && (
                        <span className="text-xs text-zinc-600">
                          {new Date(match.match_date).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      )}
                    </div>

                    {/* Edit score button — always visible on non-cancelled matches for managers */}
                    {canEditScore && (
                      <button
                        onClick={() => setEditingMatch(match)}
                        className="text-xs font-semibold text-zinc-500 hover:text-[#00ff87] px-2.5 py-1.5 rounded-lg hover:bg-[#00ff87]/10 border border-transparent hover:border-[#00ff87]/20 transition"
                      >
                        ✏ Edit Score
                      </button>
                    )}
                  </div>

                  {/* Scoreboard */}
                  <div className="grid grid-cols-3 gap-4 items-center mb-5">
                    {/* Team A */}
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#00ff87]/10 flex items-center justify-center font-black text-sm text-[#00ff87] mx-auto mb-2">
                        {match.team_a.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="font-bold text-sm truncate mb-3">{match.team_a.name}</p>

                      {isOngoing && canManage ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={pending || score.a <= 0}
                            onClick={() => act(
                              () => undoScore(match.id, event.id, "a"),
                              () => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], a: p[match.id].a - 1 } }))
                            )}
                            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 font-bold text-xl transition disabled:opacity-30 flex items-center justify-center"
                          >−</button>
                          <span className="text-4xl font-black tabular-nums w-12 text-center">{score.a}</span>
                          <button
                            disabled={pending}
                            onClick={() => act(
                              () => scoreGoal(match.id, event.id, "a"),
                              () => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], a: p[match.id].a + 1 } }))
                            )}
                            className="w-9 h-9 rounded-xl bg-[#00ff87]/20 hover:bg-[#00ff87]/40 text-[#00ff87] font-bold text-xl transition disabled:opacity-30 flex items-center justify-center"
                          >+</button>
                        </div>
                      ) : (
                        <p className={`text-5xl font-black tabular-nums ${
                          isCompleted && score.a > score.b ? "text-[#00ff87]" :
                          isCompleted && score.a < score.b ? "text-zinc-500" : ""
                        }`}>{score.a}</p>
                      )}
                    </div>

                    {/* Center */}
                    <div className="text-center">
                      <p className="text-zinc-700 font-black text-2xl">
                        {isOngoing ? "VS" : "—"}
                      </p>
                      {winner && (
                        <p className="text-xs text-zinc-500 mt-2">
                          {winner === "Draw" ? "Draw" : `${winner} wins`}
                        </p>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center font-black text-sm text-blue-400 mx-auto mb-2">
                        {match.team_b.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="font-bold text-sm truncate mb-3">{match.team_b.name}</p>

                      {isOngoing && canManage ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={pending || score.b <= 0}
                            onClick={() => act(
                              () => undoScore(match.id, event.id, "b"),
                              () => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], b: p[match.id].b - 1 } }))
                            )}
                            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 font-bold text-xl transition disabled:opacity-30 flex items-center justify-center"
                          >−</button>
                          <span className="text-4xl font-black tabular-nums w-12 text-center">{score.b}</span>
                          <button
                            disabled={pending}
                            onClick={() => act(
                              () => scoreGoal(match.id, event.id, "b"),
                              () => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], b: p[match.id].b + 1 } }))
                            )}
                            className="w-9 h-9 rounded-xl bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 font-bold text-xl transition disabled:opacity-30 flex items-center justify-center"
                          >+</button>
                        </div>
                      ) : (
                        <p className={`text-5xl font-black tabular-nums ${
                          isCompleted && score.b > score.a ? "text-[#00ff87]" :
                          isCompleted && score.b < score.a ? "text-zinc-500" : ""
                        }`}>{score.b}</p>
                      )}
                    </div>
                  </div>

                  {/* Match lifecycle buttons */}
                  {canManage && !isDone && (
                    <div className="flex items-center gap-2 justify-end flex-wrap pt-2 border-t border-white/[0.04]">
                      {status === "SCHEDULED" && (
                        <button
                          disabled={pending}
                          onClick={() => act(
                            () => startMatch(match.id, event.id),
                            () => {
                              setMatchStatuses((p) => ({ ...p, [match.id]: "ONGOING" }));
                              if (eventStatus === "SCHEDULED") setEventStatus("ONGOING");
                            }
                          )}
                          className="text-xs font-semibold bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/30 px-4 py-1.5 rounded-lg hover:bg-[#00ff87]/30 transition disabled:opacity-40"
                        >
                          ▶ Start Match
                        </button>
                      )}
                      {isOngoing && (
                        <button
                          disabled={pending}
                          onClick={() => act(
                            () => completeMatch(match.id, event.id),
                            () => setMatchStatuses((p) => ({ ...p, [match.id]: "COMPLETED" }))
                          )}
                          className="text-xs font-semibold bg-zinc-700 text-zinc-200 border border-zinc-600 px-4 py-1.5 rounded-lg hover:bg-zinc-600 transition disabled:opacity-40"
                        >
                          ✓ Complete
                        </button>
                      )}
                      <button
                        disabled={pending}
                        onClick={() => act(
                          () => cancelMatch(match.id, event.id),
                          () => setMatchStatuses((p) => ({ ...p, [match.id]: "CANCELLED" }))
                        )}
                        className="text-xs font-semibold text-red-400 border border-red-500/20 px-4 py-1.5 rounded-lg hover:bg-red-500/10 transition disabled:opacity-40"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {isTeamSport && 
      /* ── Attendees ────────────────────────────────────────────── */
      
      (
      <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="font-bold flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-400 rounded-full inline-block" />
            Attendees
            <span className="text-zinc-600 font-normal text-sm">({event.players.length})</span>
          </h2>
        </div>
        {event.players.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-zinc-600 text-sm">No players have joined yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {event.players.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-6 py-3">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center font-black text-xs text-amber-400 shrink-0">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <span className="text-sm font-medium">
                  {p.first_name} {p.last_name}
                  {p.id === currentUserId && <span className="ml-2 text-xs text-zinc-500">(you)</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      )}    </div>
  );
}