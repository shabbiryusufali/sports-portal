"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Sport = { id: string; name: string; is_team_sport: boolean };

type TeamStat = {
  id: string; name: string; sport: Sport; memberCount: number;
  played: number; wins: number; losses: number; draws: number;
  points: number; goalsFor: number; goalsAgainst: number; goalDiff: number; winRate: number;
};

type PlayerStat = {
  id: string; name: string; sport: Sport;
  played: number; wins: number; losses: number; draws: number;
  points: number; scoresFor: number; scoresAgainst: number; scoreDiff: number; winRate: number;
};

interface Props {
  teams: TeamStat[];
  players?: PlayerStat[];
  sports: Sport[];
}

const selectClass = "bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff87]/50 transition";

export default function LeaderboardsClient({ teams, players = [], sports }: Props) {
  const [mode, setMode]           = useState<"teams" | "players">("teams");
  const [sportFilter, setSportFilter] = useState("all");
  const [sortBy, setSortBy]       = useState<"points" | "winRate" | "goalsFor" | "played">("points");

  function switchMode(next: "teams" | "players") {
    setMode(next);
    setSportFilter("all");
    setSortBy("points");
  }

  // FIX: only show sports relevant to the current mode
  const filteredSports = useMemo(() =>
    sports.filter((s) => mode === "teams" ? s.is_team_sport : !s.is_team_sport),
    [sports, mode],
  );

  const filteredTeams = useMemo(() =>
    teams
      .filter((t) => sportFilter === "all" || t.sport.id === sportFilter)
      .filter((t) => t.played > 0)
      .sort((a, b) => {
        if (sortBy === "points")   return b.points - a.points || b.goalDiff - a.goalDiff;
        if (sortBy === "winRate")  return b.winRate - a.winRate;
        if (sortBy === "goalsFor") return b.goalsFor - a.goalsFor;
        return b.played - a.played;
      }),
    [teams, sportFilter, sortBy],
  );

  const filteredPlayers = useMemo(() =>
    players
      .filter((p) => sportFilter === "all" || p.sport.id === sportFilter)
      .filter((p) => p.played > 0)
      .sort((a, b) => {
        if (sortBy === "points")   return b.points - a.points || b.scoreDiff - a.scoreDiff;
        if (sortBy === "winRate")  return b.winRate - a.winRate;
        if (sortBy === "goalsFor") return b.scoresFor - a.scoresFor;
        return b.played - a.played;
      }),
    [players, sportFilter, sortBy],
  );

  const teamGroups = useMemo(() => {
    if (sportFilter !== "all") return null;
    const g: Record<string, TeamStat[]> = {};
    filteredTeams.forEach((t) => { if (!g[t.sport.name]) g[t.sport.name] = []; g[t.sport.name].push(t); });
    return Object.keys(g).length ? g : null;
  }, [filteredTeams, sportFilter]);

  const playerGroups = useMemo(() => {
    if (sportFilter !== "all") return null;
    const g: Record<string, PlayerStat[]> = {};
    filteredPlayers.forEach((p) => { if (!g[p.sport.name]) g[p.sport.name] = []; g[p.sport.name].push(p); });
    return Object.keys(g).length ? g : null;
  }, [filteredPlayers, sportFilter]);

  const sortOptions: { value: typeof sortBy; label: string }[] = [
    { value: "points",   label: "Points" },
    { value: "winRate",  label: "Win Rate" },
    { value: "goalsFor", label: mode === "teams" ? "Goals Scored" : "Points Scored" },
    { value: "played",   label: "Most Active" },
  ];

  const isEmpty = mode === "teams" ? filteredTeams.length === 0 : filteredPlayers.length === 0;

  function TeamTable({ rows, startRank = 1 }: { rows: TeamStat[]; startRank?: number }) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_repeat(6,4rem)] px-6 py-3 border-b border-white/[0.06] text-xs font-bold text-zinc-600 uppercase tracking-wider">
          <span>#</span><span>Team</span>
          <span className="text-center">P</span><span className="text-center">W</span>
          <span className="text-center">D</span><span className="text-center">L</span>
          <span className="text-center">GD</span><span className="text-center text-zinc-400">Pts</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {rows.map((team, i) => {
            const rank = startRank + i;
            const isTop3 = rank <= 3;
            const rankColor = rank === 1 ? "text-amber-400" : rank === 2 ? "text-zinc-300" : rank === 3 ? "text-amber-700" : "text-zinc-600";
            return (
              <Link key={team.id} href={`/dashboard/teams/${team.id}`}
                className={`grid grid-cols-[2rem_1fr_repeat(6,4rem)] px-6 py-4 items-center hover:bg-white/[0.03] transition ${isTop3 ? "bg-white/[0.015]" : ""}`}>
                <span className={`text-sm font-black ${rankColor}`}>{rank}</span>
                <div className="min-w-0">
                  <p className={`font-bold text-sm truncate ${isTop3 ? "text-white" : "text-zinc-200"}`}>{team.name}</p>
                  <p className="text-zinc-600 text-xs">{team.sport.name} · {team.memberCount} members</p>
                </div>
                <span className="text-center text-sm tabular-nums text-zinc-400">{team.played}</span>
                <span className="text-center text-sm tabular-nums text-[#00ff87]">{team.wins}</span>
                <span className="text-center text-sm tabular-nums text-zinc-500">{team.draws}</span>
                <span className="text-center text-sm tabular-nums text-red-400">{team.losses}</span>
                <span className={`text-center text-sm tabular-nums font-semibold ${team.goalDiff > 0 ? "text-[#00ff87]" : team.goalDiff < 0 ? "text-red-400" : "text-zinc-500"}`}>
                  {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
                </span>
                <span className={`text-center text-base font-black tabular-nums ${isTop3 ? "text-white" : "text-zinc-300"}`}>{team.points}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  function PlayerTable({ rows, startRank = 1 }: { rows: PlayerStat[]; startRank?: number }) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_repeat(6,4rem)] px-6 py-3 border-b border-white/[0.06] text-xs font-bold text-zinc-600 uppercase tracking-wider">
          <span>#</span><span>Player</span>
          <span className="text-center">P</span><span className="text-center">W</span>
          <span className="text-center">D</span><span className="text-center">L</span>
          <span className="text-center">SD</span><span className="text-center text-zinc-400">Pts</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {rows.map((player, i) => {
            const rank = startRank + i;
            const isTop3 = rank <= 3;
            const rankColor = rank === 1 ? "text-amber-400" : rank === 2 ? "text-zinc-300" : rank === 3 ? "text-amber-700" : "text-zinc-600";
            return (
              <div key={player.id}
                className={`grid grid-cols-[2rem_1fr_repeat(6,4rem)] px-6 py-4 items-center ${isTop3 ? "bg-white/[0.015]" : ""}`}>
                <span className={`text-sm font-black ${rankColor}`}>{rank}</span>
                <div className="min-w-0">
                  <p className={`font-bold text-sm truncate ${isTop3 ? "text-white" : "text-zinc-200"}`}>{player.name}</p>
                  <p className="text-zinc-600 text-xs">{player.sport.name}</p>
                </div>
                <span className="text-center text-sm tabular-nums text-zinc-400">{player.played}</span>
                <span className="text-center text-sm tabular-nums text-[#00ff87]">{player.wins}</span>
                <span className="text-center text-sm tabular-nums text-zinc-500">{player.draws}</span>
                <span className="text-center text-sm tabular-nums text-red-400">{player.losses}</span>
                <span className={`text-center text-sm tabular-nums font-semibold ${player.scoreDiff > 0 ? "text-[#00ff87]" : player.scoreDiff < 0 ? "text-red-400" : "text-zinc-500"}`}>
                  {player.scoreDiff > 0 ? "+" : ""}{player.scoreDiff}
                </span>
                <span className={`text-center text-base font-black tabular-nums ${isTop3 ? "text-white" : "text-zinc-300"}`}>{player.points}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
          {(["teams", "players"] as const).map((m) => (
            <button key={m} onClick={() => switchMode(m)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${mode === m ? "bg-[#00ff87] text-zinc-900" : "text-zinc-500 hover:text-white"}`}>
              {m === "teams" ? "🏆 Teams" : "👤 Players"}
            </button>
          ))}
        </div>

        {/* Sport filter — only shows sports relevant to current mode */}
        {filteredSports.length > 0 && (
          <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className={selectClass}>
            <option value="all">All {mode === "teams" ? "Team" : "Individual"} Sports</option>
            {filteredSports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {/* Sort */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
          {sortOptions.map((opt) => (
            <button key={opt.value} onClick={() => setSortBy(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${sortBy === opt.value ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-6 py-16 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-zinc-400 font-medium">No completed matches yet</p>
          <p className="text-zinc-600 text-sm mt-1">
            Play some matches to see standings here.
          </p>
        </div>
      ) : mode === "teams" ? (
        sportFilter !== "all" ? <TeamTable rows={filteredTeams} /> :
        teamGroups ? (
          <div className="space-y-8">
            {Object.entries(teamGroups).map(([sport, rows]) => (
              <div key={sport}>
                <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#00ff87] rounded-full inline-block" />{sport}
                </h2>
                <TeamTable rows={rows} />
              </div>
            ))}
          </div>
        ) : <TeamTable rows={filteredTeams} />
      ) : (
        sportFilter !== "all" ? <PlayerTable rows={filteredPlayers} /> :
        playerGroups ? (
          <div className="space-y-8">
            {Object.entries(playerGroups).map(([sport, rows]) => (
              <div key={sport}>
                <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-purple-500 rounded-full inline-block" />{sport}
                </h2>
                <PlayerTable rows={rows} />
              </div>
            ))}
          </div>
        ) : <PlayerTable rows={filteredPlayers} />
      )}
    </div>
  );
}