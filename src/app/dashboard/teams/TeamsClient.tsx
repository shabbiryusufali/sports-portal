"use client";

import { useState, useTransition } from "react";
import { createTeam, joinTeam } from "./actions";

type Sport = { id: string; name: string };
type Team = {
  id: string;
  name: string;
  sport: Sport;
  captain: { user: { name: string | null; email: string } } | null;
  _count: { members: number };
};

interface Props {
  teams: Team[];
  memberTeamIds: string[];
  sports: Sport[];
  userId: string;
}

export default function TeamsClient({ teams, memberTeamIds, sports }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [memberIds, setMemberIds] = useState(new Set(memberTeamIds));

  function handleCreate(fd: FormData) {
    setError(null);
    setSuccess(null);
    start(async () => {
      const res = await createTeam(fd);
      if (!res.success) {
        setError(res.message ?? "Failed to create team.");
      } else {
        setSuccess("Team created! Refresh to see it.");
        setShowCreate(false);
      }
    });
  }

  function handleJoin(teamId: string) {
    setError(null);
    setSuccess(null);
    start(async () => {
      const res = await joinTeam(teamId);
      if (!res.success) {
        setError(res.message ?? "Failed to join team.");
      } else {
        setMemberIds((prev) => new Set([...prev, teamId]));
        setSuccess("You joined the team!");
      }
    });
  }

  return (
    <div>
      {/* Notifications */}
      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-900/30 border border-green-700 text-green-400 text-sm px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Create Team Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="bg-[#00ff87] text-zinc-900 font-bold px-5 py-2.5 rounded-xl hover:bg-[#00e87a] transition text-sm"
        >
          {showCreate ? "Cancel" : "+ Create Team"}
        </button>
      </div>

      {/* Create Team Form */}
      {showCreate && (
        <form
          action={handleCreate}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 space-y-4"
        >
          <h2 className="text-lg font-bold">New Team</h2>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Team Name
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Thunder Hawks"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Sport
            </label>
            <select
              name="sport_id"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff87] transition"
            >
              <option value="">Select a sport…</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-50 text-sm"
          >
            {pending ? "Creating…" : "Create Team"}
          </button>
        </form>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
          <p className="text-zinc-400 text-sm">
            No teams yet. Be the first to create one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const isMember = memberIds.has(team.id);
            return (
              <div
                key={team.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-sm text-[#00ff87] shrink-0">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {team.name}
                    </p>
                    <p className="text-zinc-400 text-xs">{team.sport.name}</p>
                  </div>
                </div>

                <div className="text-zinc-500 text-xs space-y-0.5">
                  <p>
                    Captain:{" "}
                    <span className="text-zinc-300">
                      {team.captain?.user.name ??
                        team.captain?.user.email ??
                        "—"}
                    </span>
                  </p>
                  <p>
                    Members:{" "}
                    <span className="text-zinc-300">{team._count.members}</span>
                  </p>
                </div>

                {isMember ? (
                  <span className="mt-auto text-xs font-semibold text-[#00ff87] bg-[#00ff87]/10 border border-[#00ff87]/20 px-3 py-1.5 rounded-lg text-center">
                    ✓ Member
                  </span>
                ) : (
                  <button
                    onClick={() => handleJoin(team.id)}
                    disabled={pending}
                    className="mt-auto text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    Join Team
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
