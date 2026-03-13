"use client";

import { useState, useTransition, useOptimistic } from "react";
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

  function flash(type: "ok" | "err", msg: string) {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3000);
  }

  function act<T>(
    fn: () => Promise<{ success: boolean; message?: string }>,
    onSuccess?: () => void,
  ) {
    start(async () => {
      const res = await fn();
      if (res.success) {
        onSuccess?.();
      } else {
        flash("err", res.message ?? "Something went wrong");
      }
    });
  }

  function handleScoreGoal(matchId: string, team: "a" | "b") {
    act(
      () => scoreGoal(matchId, event.id, team),
      () => setScores((prev) => ({
        ...prev,
        [matchId]: {
          a: prev[matchId].a + (team === "a" ? 1 : 0),
          b: prev[matchId].b + (team === "b" ? 1 : 0),
        },
      })),
    );
  }

  function handleUndoScore(matchId: string, team: "a" | "b") {
    const current = scores[matchId];
    if ((team === "a" ? current.a : current.b) <= 0) return;
    act(
      () => undoScore(matchId, event.id, team),
      () => setScores((prev) => ({
        ...prev,
        [matchId]: {
          a: prev[matchId].a - (team === "a" ? 1 : 0),
          b: prev[matchId].b - (team === "b" ? 1 : 0),
        },
      })),
    );
  }

  const isEventDone = eventStatus === "COMPLETED" || eventStatus === "CANCELLED";

  return (
    <div className="space-y-8">
      {/* Notice */}
      {notice && (
        <div
          className={`text-sm px-4 py-3 rounded-lg border ${
            notice.type === "ok"
              ? "bg-green-900/30 border-green-700 text-green-400"
              : "bg-red-900/30 border-red-700 text-red-400"
          }`}
        >
          {notice.msg}
        </div>
      )}

      {/* Event Status Controls */}
      {canManage && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
            Event Controls
          </h2>
          <div className="flex flex-wrap gap-3">
            {eventStatus === "SCHEDULED" && (
              <button
                disabled={pending}
                onClick={() =>
                  act(() => updateEventStatus(event.id, "ONGOING"), () => setEventStatus("ONGOING"))
                }
                className="bg-[#00ff87] text-zinc-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#00e87a] transition disabled:opacity-50"
              >
                ▶ Start Event
              </button>
            )}
            {eventStatus === "ONGOING" && (
              <button
                disabled={pending}
                onClick={() =>
                  act(() => updateEventStatus(event.id, "COMPLETED"), () => setEventStatus("COMPLETED"))
                }
                className="bg-zinc-700 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-zinc-600 transition disabled:opacity-50"
              >
                ✓ Complete Event
              </button>
            )}
            {!isEventDone && (
              <button
                disabled={pending}
                onClick={() =>
                  act(() => updateEventStatus(event.id, "CANCELLED"), () => setEventStatus("CANCELLED"))
                }
                className="border border-red-700/50 text-red-400 font-medium px-4 py-2 rounded-xl text-sm hover:bg-red-900/20 transition disabled:opacity-50"
              >
                ✕ Cancel Event
              </button>
            )}
            {isEventDone && (
              <span className="text-zinc-500 text-sm py-2">
                This event is {eventStatus.toLowerCase()}.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Teams */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff87] inline-block" />
            Participating Teams
            <span className="text-zinc-600 text-sm font-normal">({event.participants.length})</span>
          </h2>
          {canManage && !isEventDone && addableTeams.length > 0 && (
            <button
              onClick={() => setShowAddTeam((v) => !v)}
              className="text-xs text-[#00ff87] border border-[#00ff87]/30 px-3 py-1.5 rounded-lg hover:bg-[#00ff87]/10 transition"
            >
              {showAddTeam ? "Cancel" : "+ Add Team"}
            </button>
          )}
        </div>

        {/* Add team dropdown */}
        {showAddTeam && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 flex gap-3">
            <select
              id="add-team-select"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
            >
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
                  // Note: page will revalidate via server
                });
              }}
              className="bg-[#00ff87] text-zinc-900 font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#00e87a] transition disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}

        {event.participants.length === 0 ? (
          <p className="text-zinc-500 text-sm bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            No teams yet. {canManage ? "Add teams above to get started." : ""}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {event.participants.map((team) => (
              <div
                key={team.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-[#00ff87] shrink-0">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{team.name}</p>
                    <p className="text-zinc-500 text-xs">{team._count.members} members</p>
                  </div>
                </div>
                {canManage && !isEventDone && (
                  <button
                    disabled={pending}
                    onClick={() =>
                      act(() => removeTeamFromEvent(event.id, team.id), () =>
                        flash("ok", "Team removed"),
                      )
                    }
                    className="text-zinc-600 hover:text-red-400 transition text-xs shrink-0"
                    title="Remove team"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Matches */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            Matches
            <span className="text-zinc-600 text-sm font-normal">({event.matches.length})</span>
          </h2>
          {canManage && !isEventDone && teamsInSport.length >= 2 && (
            <button
              onClick={() => setShowAddMatch((v) => !v)}
              className="text-xs text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-500/10 transition"
            >
              {showAddMatch ? "Cancel" : "+ Add Match"}
            </button>
          )}
        </div>

        {/* Add match form */}
        {showAddMatch && (
          <AddMatchForm
            eventId={event.id}
            teams={teamsInSport}
            pending={pending}
            onAdd={() => {
              flash("ok", "Match added!");
              setShowAddMatch(false);
            }}
          />
        )}

        {event.matches.length === 0 ? (
          <p className="text-zinc-500 text-sm bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            No matches yet. {canManage && teamsInSport.length >= 2 ? "Add a match above." : ""}
          </p>
        ) : (
          <div className="space-y-4">
            {event.matches.map((match) => {
              const score = scores[match.id] ?? { a: match.score_team_a, b: match.score_team_b };
              const status = matchStatuses[match.id] ?? match.status;
              const isOngoing = status === "ONGOING";
              const isDone = status === "COMPLETED" || status === "CANCELLED";

              const winner =
                status === "COMPLETED"
                  ? score.a > score.b
                    ? match.team_a.name
                    : score.b > score.a
                    ? match.team_b.name
                    : "Draw"
                  : null;

              return (
                <div
                  key={match.id}
                  className={`bg-zinc-900 border rounded-2xl p-5 transition ${
                    isOngoing ? "border-[#00ff87]/40" : "border-zinc-800"
                  }`}
                >
                  {/* Match header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          status === "ONGOING"
                            ? "bg-green-900/40 text-green-400 border-green-700/50 animate-pulse"
                            : status === "COMPLETED"
                            ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                            : status === "CANCELLED"
                            ? "bg-red-900/30 text-red-400 border-red-700/50"
                            : "bg-blue-900/30 text-blue-400 border-blue-700/50"
                        }`}
                      >
                        {status === "ONGOING" ? "● LIVE" : status}
                      </span>
                      <span className="text-xs text-zinc-600">{match.match_type}</span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(match.match_date).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>

                  {/* Score board */}
                  <div className="flex items-center gap-4">
                    {/* Team A */}
                    <div className="flex-1 text-center">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-sm text-[#00ff87] mx-auto mb-2">
                        {match.team_a.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="font-semibold text-sm truncate">{match.team_a.name}</p>
                      {isOngoing && canManage && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <button
                            disabled={pending}
                            onClick={() => handleUndoScore(match.id, "a")}
                            className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition text-lg font-bold flex items-center justify-center disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="text-3xl font-black tabular-nums w-10 text-center">
                            {score.a}
                          </span>
                          <button
                            disabled={pending}
                            onClick={() => handleScoreGoal(match.id, "a")}
                            className="w-7 h-7 rounded-lg bg-[#00ff87]/20 text-[#00ff87] hover:bg-[#00ff87]/40 transition text-lg font-bold flex items-center justify-center disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      )}
                      {!isOngoing && (
                        <p className="text-4xl font-black mt-2 tabular-nums">{score.a}</p>
                      )}
                    </div>

                    {/* VS divider */}
                    <div className="text-zinc-600 font-bold text-sm">VS</div>

                    {/* Team B */}
                    <div className="flex-1 text-center">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-sm text-purple-400 mx-auto mb-2">
                        {match.team_b.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="font-semibold text-sm truncate">{match.team_b.name}</p>
                      {isOngoing && canManage && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <button
                            disabled={pending}
                            onClick={() => handleUndoScore(match.id, "b")}
                            className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition text-lg font-bold flex items-center justify-center disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="text-3xl font-black tabular-nums w-10 text-center">
                            {score.b}
                          </span>
                          <button
                            disabled={pending}
                            onClick={() => handleScoreGoal(match.id, "b")}
                            className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 transition text-lg font-bold flex items-center justify-center disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      )}
                      {!isOngoing && (
                        <p className="text-4xl font-black mt-2 tabular-nums">{score.b}</p>
                      )}
                    </div>
                  </div>

                  {/* Winner banner */}
                  {winner && (
                    <div className="mt-4 text-center text-sm font-semibold text-[#00ff87]">
                      {winner === "Draw" ? "🤝 Draw" : `🏆 ${winner} wins!`}
                    </div>
                  )}

                  {/* Controls */}
                  {canManage && !isDone && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
                      {status === "SCHEDULED" && (
                        <button
                          disabled={pending}
                          onClick={() =>
                            act(() => startMatch(match.id, event.id), () =>
                              setMatchStatuses((prev) => ({ ...prev, [match.id]: "ONGOING" })),
                            )
                          }
                          className="flex-1 bg-[#00ff87] text-zinc-900 font-bold py-2 rounded-xl text-sm hover:bg-[#00e87a] transition disabled:opacity-50"
                        >
                          ▶ Start Match
                        </button>
                      )}
                      {status === "ONGOING" && (
                        <button
                          disabled={pending}
                          onClick={() =>
                            act(() => completeMatch(match.id, event.id), () =>
                              setMatchStatuses((prev) => ({ ...prev, [match.id]: "COMPLETED" })),
                            )
                          }
                          className="flex-1 bg-zinc-700 text-white font-bold py-2 rounded-xl text-sm hover:bg-zinc-600 transition disabled:opacity-50"
                        >
                          ✓ End Match
                        </button>
                      )}
                      <button
                        disabled={pending}
                        onClick={() =>
                          act(() => cancelMatch(match.id, event.id), () =>
                            setMatchStatuses((prev) => ({ ...prev, [match.id]: "CANCELLED" })),
                          )
                        }
                        className="border border-zinc-700 text-zinc-400 px-4 py-2 rounded-xl text-sm hover:border-red-700/50 hover:text-red-400 transition disabled:opacity-50"
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
      </section>
    </div>
  );
}

// ── Add Match Form ────────────────────────────────────────────────────────────

function AddMatchForm({
  eventId,
  teams,
  pending,
  onAdd,
}: {
  eventId: string;
  teams: Team[];
  pending: boolean;
  onAdd: () => void;
}) {
  const [, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(fd: FormData) {
    setErr(null);
    start(async () => {
      const res = await addMatch(eventId, fd);
      if (res.success) {
        onAdd();
      } else {
        setErr(res.message ?? "Failed to add match");
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 mb-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-zinc-300">New Match</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Team A</label>
          <select
            name="team_a_id"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Team B</label>
          <select
            name="team_b_id"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Match Date/Time</label>
          <input
            type="datetime-local"
            name="match_date"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Type</label>
          <select
            name="match_type"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
          >
            <option value="FRIENDLY">Friendly</option>
            <option value="TOURNAMENT">Tournament</option>
          </select>
        </div>
      </div>

      {err && <p className="text-red-400 text-xs">{err}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-purple-600 text-white font-bold py-2 rounded-xl text-sm hover:bg-purple-500 transition disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add Match"}
      </button>
    </form>
  );
}