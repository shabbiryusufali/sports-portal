"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Sport = { id: string; name: string };
type TeamStat = {
  id: string;
  name: string;
  sport: Sport;
  memberCount: number;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  winRate: number;
};

interface Props {
  teams: TeamStat[];
  sports: Sport[];
}

export default function LeaderboardsClient({ teams, sports }: Props) {
  const [sportFilter, setSportFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"points" | "winRate" | "goalsFor" | "played">("points");

  const filtered = useMemo(() => {
    return teams
      .filter((t) => sportFilter === "all" || t.sport.id === sportFilter)
      .filter((t) => t.played > 0)
      .sort((a, b) => {
        if (sortBy === "points")  return b.points - a.points || b.goalDiff - a.goalDiff;
        if (sortBy === "winRate") return b.winRate - a.winRate;
        if (sortBy === "goalsFor") return b.goalsFor - a.goalsFor;
        return b.played - a.played;
      });
  }, [teams, sportFilter, sortBy]);

  const noMatchTeams = teams.filter((t) => t.played === 0).length;

  const sportGroups = useMemo(() => {
    if (sportFilter !== "all") return null;
    const groups: Record<string, TeamStat[]> = {};
    filtered.forEach((t) => {
      if (!groups[t.sport.name]) groups[t.sport.name] = [];
      groups[t.sport.name].push(t);
    });
    return groups;
  }, [filtered, sportFilter]);

  const sortOptions: { value: typeof sortBy; label: string }[] = [
    { value: "points",   label: "Points" },
    { value: "winRate",  label: "Win Rate" },
    { value: "goalsFor", label: "Goals Scored" },
    { value: "played",   label: "Most Active" },
  ];

  const selectClass =
    "bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff87]/50 transition";

  function StandingsTable({ rows, startRank = 1 }: { rows: TeamStat[]; startRank?: number }) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2rem_1fr_repeat(6,4rem)] gap-0 px-6 py-3 border-b border-white/[0.06] text-xs font-bold text-zinc-600 uppercase tracking-wider">
          <span>#</span>
          <span>Team</span>
          <span className="text-center">P</span>
          <span className="text-center">W</span>
          <span className="text-center">D</span>
          <span className="text-center">L</span>
          <span className="text-center">GD</span>
          <span className="text-center font-black text-zinc-400">Pts</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {rows.map((team, i) => {
            const rank = startRank + i;
            const rankColor =
              rank === 1 ? "text-yellow-400" :
              rank === 2 ? "text-zinc-300" :
              rank === 3 ? "text-amber-600" :
              "text-zinc-600";
            const isTop3 = rank <= 3;

            return (
              <Link
                key={team.id}
                href={`/dashboard/teams/${team.id}`}
                className={`grid grid-cols-[2rem_1fr_repeat(6,4rem)] gap-0 items-center px-6 py-4 hover:bg-white/[0.03] transition group ${isTop3 ? "bg-white/[0.01]" : ""}`}
              >
                <span className={`font-black text-sm ${rankColor}`}>
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                </span>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                    isTop3 ? "bg-[#00ff87]/10 text-[#00ff87]" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm truncate group-hover:text-[#00ff87] transition ${isTop3 ? "text-white" : "text-zinc-300"}`}>
                      {team.name}
                    </p>
                    <p className="text-zinc-600 text-xs">{team.memberCount} members</p>
                  </div>
                </div>
                <span className="text-center text-sm text-zinc-400 tabular-nums">{team.played}</span>
                <span className="text-center text-sm text-[#00ff87] font-bold tabular-nums">{team.wins}</span>
                <span className="text-center text-sm text-zinc-500 tabular-nums">{team.draws}</span>
                <span className="text-center text-sm text-red-400 tabular-nums">{team.losses}</span>
                <span className={`text-center text-sm tabular-nums font-semibold ${
                  team.goalDiff > 0 ? "text-[#00ff87]" : team.goalDiff < 0 ? "text-red-400" : "text-zinc-500"
                }`}>
                  {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
                </span>
                <span className={`text-center text-base font-black tabular-nums ${isTop3 ? "text-white" : "text-zinc-300"}`}>
                  {team.points}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className={selectClass}>
          <option value="all">All Sports</option>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                sortBy === opt.value
                  ? "bg-[#00ff87] text-zinc-900"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-6 py-16 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-zinc-400 font-medium">No completed matches yet</p>
          <p className="text-zinc-600 text-sm mt-1">
            {noMatchTeams > 0 ? `${noMatchTeams} team${noMatchTeams > 1 ? "s" : ""} registered — play some matches to see standings.` : "Create teams and play matches to see standings here."}
          </p>
        </div>
      ) : sportFilter !== "all" && sportGroups === null ? (
        <StandingsTable rows={filtered} />
      ) : sportGroups !== null && Object.entries(sportGroups).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(sportGroups).map(([sportName, rows]) => (
            <div key={sportName}>
              <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#00ff87] rounded-full inline-block" />
                {sportName}
              </h2>
              <StandingsTable rows={rows} />
            </div>
          ))}
        </div>
      ) : (
        <StandingsTable rows={filtered} />
      )}

      {noMatchTeams > 0 && (
        <p className="text-zinc-700 text-xs text-center">
          {noMatchTeams} team{noMatchTeams > 1 ? "s" : ""} with no matches played are not shown.
        </p>
      )}
    </div>
  );
}