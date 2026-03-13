"use client";

import { useState, useTransition } from "react";
import {
  addTeamToEvent,
  removeTeamFromEvent,
  addMatch,
  startMatch,
  scoreGoal,
  undoScore,
  completeMatch,
  cancelMatch,
  updateEventStatus,
} from "./actions";

type Team = { id: string; name: string };
type Match = {
  id: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
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
    status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
    sport_id: string;
    participants: Participant[];
    matches: Match[];
  };
  canManage: boolean;
  teamsInSport: Team[];
}

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#00ff87]/50 transition";

export default function EventClient({ event, canManage, teamsInSport }: Props) {
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [scores, setScores] = useState<Record<string, { a: number; b: number }>>(() => {
    const init: Record<string, { a: number; b: number }> = {};
    event.matches.forEach((m) => { init[m.id] = { a: m.score_team_a, b: m.score_team_b }; });
    return init;
  });
  const [matchStatuses, setMatchStatuses] = useState<Record<string, Match["status"]>>(() => {
    const init: Record<string, Match["status"]> = {};
    event.matches.forEach((m) => { init[m.id] = m.status; });
    return init;
  });
  const [eventStatus, setEventStatus] = useState(event.status);

  const participantIds = new Set(event.participants.map((p) => p.id));
  const addableTeams = teamsInSport.filter((t) => !participantIds.has(t.id));
  const isEventDone = eventStatus === "COMPLETED" || eventStatus === "CANCELLED";

  function flash(type: "ok" | "err", msg: string) {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3000);
  }

  function act(fn: () => Promise<{ success: boolean; message?: string }>, onSuccess?: () => void) {
    start(async () => {
      const res = await fn();
      if (res.success) onSuccess?.();
      else flash("err", res.message ?? "Something went wrong");
    });
  }

  return (
    <div className="space-y-6">
      {/* Notice */}
      {notice && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${
          notice.type === "ok"
            ? "bg-[#00ff87]/10 border-[#00ff87]/20 text-[#00ff87]"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {notice.msg}
        </div>
      )}

      {/* Event Controls */}
      {canManage && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Event Controls</p>
          <div className="flex flex-wrap gap-3">
            {eventStatus === "SCHEDULED" && (
              <button
                disabled={pending}
                onClick={() => act(() => updateEventStatus(event.id, "ONGOING"), () => setEventStatus("ONGOING"))}
                className="bg-[#00ff87] text-zinc-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00e87a] transition disabled:opacity-40"
              >
                ▶ Start Event
              </button>
            )}
            {eventStatus === "ONGOING" && (
              <button
                disabled={pending}
                onClick={() => act(() => updateEventStatus(event.id, "COMPLETED"), () => setEventStatus("COMPLETED"))}
                className="bg-white/10 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/15 transition disabled:opacity-40"
              >
                ✓ Complete Event
              </button>
            )}
            {!isEventDone && (
              <button
                disabled={pending}
                onClick={() => act(() => updateEventStatus(event.id, "CANCELLED"), () => setEventStatus("CANCELLED"))}
                className="border border-red-500/20 text-red-400 font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-red-500/10 transition disabled:opacity-40"
              >
                ✕ Cancel
              </button>
            )}
            {isEventDone && (
              <p className="text-zinc-600 text-sm py-2">This event is {eventStatus.toLowerCase()}.</p>
            )}
          </div>
        </div>
      )}

      {/* Teams */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
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
            <select id="add-team-select" className={`flex-1 ${inputClass}`}>
              {addableTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              disabled={pending}
              onClick={() => {
                const sel = document.getElementById("add-team-select") as HTMLSelectElement;
                if (!sel.value) return;
                act(() => addTeamToEvent(event.id, sel.value), () => {
                  flash("ok", "Team added!");
                  setShowAddTeam(false);
                });
              }}
              className="bg-[#00ff87] text-zinc-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00e87a] transition disabled:opacity-40"
            >
              Add
            </button>
          </div>
        )}

        {event.participants.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-zinc-600 text-sm">{canManage ? "No teams yet — add some above." : "No teams participating."}</p>
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
                  <p className="text-zinc-600 text-xs">{team._count.members} members</p>
                </div>
                {canManage && !isEventDone && (
                  <button
                    disabled={pending}
                    onClick={() => act(() => removeTeamFromEvent(event.id, team.id), () => flash("ok", "Team removed"))}
                    className="text-zinc-700 hover:text-red-400 transition text-sm px-2 py-1 rounded-lg hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Matches */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-500 rounded-full inline-block" />
            Matches
            <span className="text-zinc-600 font-normal text-sm">({event.matches.length})</span>
          </h2>
          {canManage && !isEventDone && teamsInSport.length >= 2 && (
            <button
              onClick={() => setShowAddMatch((v) => !v)}
              className="text-xs font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg transition"
            >
              {showAddMatch ? "Cancel" : "+ Add Match"}
            </button>
          )}
        </div>

        {showAddMatch && (
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <AddMatchForm
              eventId={event.id}
              teams={teamsInSport}
              pending={pending}
              onAdd={() => { flash("ok", "Match added!"); setShowAddMatch(false); }}
            />
          </div>
        )}

        {event.matches.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-zinc-600 text-sm">
              {canManage && teamsInSport.length >= 2
                ? "No matches yet — add one above."
                : "No matches scheduled."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {event.matches.map((match) => {
              const score = scores[match.id] ?? { a: match.score_team_a, b: match.score_team_b };
              const status = matchStatuses[match.id] ?? match.status;
              const isOngoing = status === "ONGOING";
              const isDone = status === "COMPLETED" || status === "CANCELLED";
              const winner =
                status === "COMPLETED"
                  ? score.a > score.b ? match.team_a.name
                  : score.b > score.a ? match.team_b.name
                  : "Draw"
                  : null;

              return (
                <div key={match.id} className="p-6">
                  {/* Match meta */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      {isOngoing ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#00ff87] bg-[#00ff87]/10 px-3 py-1.5 rounded-full border border-[#00ff87]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                          status === "COMPLETED" ? "text-zinc-400 bg-zinc-800 border-zinc-700" :
                          status === "CANCELLED" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                          "text-blue-400 bg-blue-500/10 border-blue-500/20"
                        }`}>
                          {status}
                        </span>
                      )}
                      <span className="text-xs text-zinc-600 font-medium">{match.match_type}</span>
                    </div>
                    <span className="text-xs text-zinc-600">
                      {new Date(match.match_date).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>

                  {/* Scoreboard */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Team A */}
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#00ff87]/10 flex items-center justify-center font-black text-sm text-[#00ff87] mx-auto mb-2">
                        {match.team_a.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="font-bold text-sm truncate mb-3">{match.team_a.name}</p>
                      {isOngoing && canManage ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={pending}
                            onClick={() => {
                              if (score.a <= 0) return;
                              act(() => undoScore(match.id, event.id, "a"), () =>
                                setScores((p) => ({ ...p, [match.id]: { ...p[match.id], a: p[match.id].a - 1 } }))
                              );
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 font-bold text-lg transition disabled:opacity-30 flex items-center justify-center"
                          >−</button>
                          <span className="text-4xl font-black tabular-nums w-12 text-center">{score.a}</span>
                          <button
                            disabled={pending}
                            onClick={() => act(() => scoreGoal(match.id, event.id, "a"), () =>
                              setScores((p) => ({ ...p, [match.id]: { ...p[match.id], a: p[match.id].a + 1 } }))
                            )}
                            className="w-8 h-8 rounded-lg bg-[#00ff87]/20 hover:bg-[#00ff87]/40 text-[#00ff87] font-bold text-lg transition disabled:opacity-30 flex items-center justify-center"
                          >+</button>
                        </div>
                      ) : (
                        <p className={`text-5xl font-black tabular-nums ${
                          status === "COMPLETED" && score.a > score.b ? "text-[#00ff87]" : ""
                        }`}>{score.a}</p>
                      )}
                    </div>

                    {/* VS */}
                    <div className="text-center">
                      <p className="text-zinc-700 font-black text-lg">VS</p>
                      {winner && (
                        <p className="text-xs text-[#00ff87] font-bold mt-2">
                          {winner === "Draw" ? "🤝 Draw" : "🏆 Winner"}
                        </p>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center font-black text-sm text-purple-400 mx-auto mb-2">
                        {match.team_b.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="font-bold text-sm truncate mb-3">{match.team_b.name}</p>
                      {isOngoing && canManage ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={pending}
                            onClick={() => {
                              if (score.b <= 0) return;
                              act(() => undoScore(match.id, event.id, "b"), () =>
                                setScores((p) => ({ ...p, [match.id]: { ...p[match.id], b: p[match.id].b - 1 } }))
                              );
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 font-bold text-lg transition disabled:opacity-30 flex items-center justify-center"
                          >−</button>
                          <span className="text-4xl font-black tabular-nums w-12 text-center">{score.b}</span>
                          <button
                            disabled={pending}
                            onClick={() => act(() => scoreGoal(match.id, event.id, "b"), () =>
                              setScores((p) => ({ ...p, [match.id]: { ...p[match.id], b: p[match.id].b + 1 } }))
                            )}
                            className="w-8 h-8 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 font-bold text-lg transition disabled:opacity-30 flex items-center justify-center"
                          >+</button>
                        </div>
                      ) : (
                        <p className={`text-5xl font-black tabular-nums ${
                          status === "COMPLETED" && score.b > score.a ? "text-[#00ff87]" : ""
                        }`}>{score.b}</p>
                      )}
                    </div>
                  </div>

                  {/* Winner name */}
                  {winner && winner !== "Draw" && (
                    <p className="text-center text-sm font-bold text-[#00ff87] mt-4">{winner} wins!</p>
                  )}

                  {/* Match controls */}
                  {canManage && !isDone && (
                    <div className="flex gap-2 mt-5 pt-5 border-t border-white/[0.06]">
                      {status === "SCHEDULED" && (
                        <button
                          disabled={pending}
                          onClick={() => act(() => startMatch(match.id, event.id), () =>
                            setMatchStatuses((p) => ({ ...p, [match.id]: "ONGOING" }))
                          )}
                          className="flex-1 bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl text-sm hover:bg-[#00e87a] transition disabled:opacity-40"
                        >
                          ▶ Start Match
                        </button>
                      )}
                      {status === "ONGOING" && (
                        <button
                          disabled={pending}
                          onClick={() => act(() => completeMatch(match.id, event.id), () =>
                            setMatchStatuses((p) => ({ ...p, [match.id]: "COMPLETED" }))
                          )}
                          className="flex-1 bg-white/10 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-white/15 transition disabled:opacity-40"
                        >
                          ✓ End Match
                        </button>
                      )}
                      <button
                        disabled={pending}
                        onClick={() => act(() => cancelMatch(match.id, event.id), () =>
                          setMatchStatuses((p) => ({ ...p, [match.id]: "CANCELLED" }))
                        )}
                        className="border border-white/10 text-zinc-500 hover:text-red-400 hover:border-red-500/30 px-4 py-2.5 rounded-xl text-sm transition disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Match Form ────────────────────────────────────────────────────────────

function AddMatchForm({
  eventId, teams, pending, onAdd,
}: {
  eventId: string;
  teams: Team[];
  pending: boolean;
  onAdd: () => void;
}) {
  const [, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff87]/50 transition";

  return (
    <form
      action={(fd) => {
        setErr(null);
        start(async () => {
          const res = await addMatch(eventId, fd);
          if (res.success) onAdd();
          else setErr(res.message ?? "Failed to add match");
        });
      }}
      className="space-y-4"
    >
      <p className="text-sm font-semibold text-zinc-300">New Match</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Team A</label>
          <select name="team_a_id" required className={inputClass}>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Team B</label>
          <select name="team_b_id" required className={inputClass}>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Date & Time</label>
          <input type="datetime-local" name="match_date" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Type</label>
          <select name="match_type" className={inputClass}>
            <option value="FRIENDLY">Friendly</option>
            <option value="TOURNAMENT">Tournament</option>
          </select>
        </div>
      </div>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-purple-500 transition disabled:opacity-40"
      >
        {pending ? "Adding…" : "Add Match"}
      </button>
    </form>
  );
}