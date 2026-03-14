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
interface Props { teams: TeamStat[]; players?: PlayerStat[]; sports: Sport[]; }

export default function LeaderboardsClient({ teams, players = [], sports }: Props) {
  const [mode, setMode] = useState<"teams" | "players">("teams");
  const [sportFilter, setSportFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"points" | "winRate" | "goalsFor" | "played">("points");

  function switchMode(next: "teams" | "players") { setMode(next); setSportFilter("all"); setSortBy("points"); }

  const filteredSports = useMemo(() => sports.filter((s) => mode === "teams" ? s.is_team_sport : !s.is_team_sport), [sports, mode]);

  const filteredTeams = useMemo(() => teams
    .filter((t) => (sportFilter === "all" || t.sport.id === sportFilter) && t.played > 0)
    .sort((a, b) => sortBy === "points" ? b.points - a.points || b.goalDiff - a.goalDiff : sortBy === "winRate" ? b.winRate - a.winRate : sortBy === "goalsFor" ? b.goalsFor - a.goalsFor : b.played - a.played),
    [teams, sportFilter, sortBy]);

  const filteredPlayers = useMemo(() => players
    .filter((p) => (sportFilter === "all" || p.sport.id === sportFilter) && p.played > 0)
    .sort((a, b) => sortBy === "points" ? b.points - a.points || b.scoreDiff - a.scoreDiff : sortBy === "winRate" ? b.winRate - a.winRate : sortBy === "goalsFor" ? b.scoresFor - a.scoresFor : b.played - a.played),
    [players, sportFilter, sortBy]);

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

  const rankColor = (r: number) => r === 1 ? "#fbbf24" : r === 2 ? "#d1d5db" : r === 3 ? "#b45309" : "var(--text-muted)";

  function TeamTable({ rows, startRank = 1 }: { rows: TeamStat[]; startRank?: number }) {
    return (
      <div className="sp-card" style={{ overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2rem 1fr repeat(6, 3.5rem)", padding: "10px 20px", borderBottom: "1px solid var(--border)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          <span>#</span><span>Team</span>
          <span style={{ textAlign: "center" }}>P</span>
          <span style={{ textAlign: "center" }}>W</span>
          <span style={{ textAlign: "center" }}>D</span>
          <span style={{ textAlign: "center" }}>L</span>
          <span style={{ textAlign: "center" }}>GD</span>
          <span style={{ textAlign: "center", color: "var(--text-secondary)" }}>Pts</span>
        </div>
        {rows.map((team, i) => {
          const rank = startRank + i;
          const isTop3 = rank <= 3;
          return (
            <Link key={team.id} href={`/dashboard/teams/${team.id}`} style={{ textDecoration: "none" }}>
              <div
                style={{ display: "grid", gridTemplateColumns: "2rem 1fr repeat(6, 3.5rem)", padding: "14px 20px", alignItems: "center", borderTop: "1px solid var(--border)", background: isTop3 ? "rgba(255,255,255,0.015)" : undefined, transition: "background 0.12s" }}
                onMouseEnter={(el) => { (el.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(el) => { (el.currentTarget as HTMLElement).style.background = isTop3 ? "rgba(255,255,255,0.015)" : ""; }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: 900, color: rankColor(rank) }}>{rank}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isTop3 ? "var(--text-primary)" : "var(--text-secondary)" }}>{team.name}</p>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{team.sport.name} · {team.memberCount}m</p>
                </div>
                <span style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)", tabularNums: true } as any}>{team.played}</span>
                <span style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--accent)", fontWeight: 700 }}>{team.wins}</span>
                <span style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>{team.draws}</span>
                <span style={{ textAlign: "center", fontSize: "0.875rem", color: "#f87171" }}>{team.losses}</span>
                <span style={{ textAlign: "center", fontSize: "0.875rem", fontWeight: 600, color: team.goalDiff > 0 ? "var(--accent)" : team.goalDiff < 0 ? "#f87171" : "var(--text-muted)" }}>
                  {team.goalDiff > 0 ? "+" : ""}{team.goalDiff}
                </span>
                <span style={{ textAlign: "center", fontSize: "1rem", fontWeight: 900, color: isTop3 ? "var(--text-primary)" : "var(--text-secondary)" }}>{team.points}</span>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  function PlayerTable({ rows, startRank = 1 }: { rows: PlayerStat[]; startRank?: number }) {
    return (
      <div className="sp-card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2rem 1fr repeat(6, 3.5rem)", padding: "10px 20px", borderBottom: "1px solid var(--border)", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
          <span>#</span><span>Player</span>
          <span style={{ textAlign: "center" }}>P</span><span style={{ textAlign: "center" }}>W</span>
          <span style={{ textAlign: "center" }}>D</span><span style={{ textAlign: "center" }}>L</span>
          <span style={{ textAlign: "center" }}>SD</span><span style={{ textAlign: "center", color: "var(--text-secondary)" }}>Pts</span>
        </div>
        {rows.map((p, i) => {
          const rank = startRank + i; const isTop3 = rank <= 3;
          return (
            <div key={p.id}
              style={{ display: "grid", gridTemplateColumns: "2rem 1fr repeat(6, 3.5rem)", padding: "14px 20px", alignItems: "center", borderTop: "1px solid var(--border)", background: isTop3 ? "rgba(255,255,255,0.015)" : undefined }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 900, color: rankColor(rank) }}>{rank}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isTop3 ? "var(--text-primary)" : "var(--text-secondary)" }}>{p.name}</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{p.sport.name}</p>
              </div>
              <span style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>{p.played}</span>
              <span style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--accent)", fontWeight: 700 }}>{p.wins}</span>
              <span style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>{p.draws}</span>
              <span style={{ textAlign: "center", fontSize: "0.875rem", color: "#f87171" }}>{p.losses}</span>
              <span style={{ textAlign: "center", fontSize: "0.875rem", fontWeight: 600, color: p.scoreDiff > 0 ? "var(--accent)" : p.scoreDiff < 0 ? "#f87171" : "var(--text-muted)" }}>
                {p.scoreDiff > 0 ? "+" : ""}{p.scoreDiff}
              </span>
              <span style={{ textAlign: "center", fontSize: "1rem", fontWeight: 900, color: isTop3 ? "var(--text-primary)" : "var(--text-secondary)" }}>{p.points}</span>
            </div>
          );
        })}
      </div>
    );
  }

  const isEmpty = mode === "teams" ? filteredTeams.length === 0 : filteredPlayers.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* Mode toggle */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, gap: 2 }}>
          {(["teams", "players"] as const).map((m) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              padding: "7px 18px", borderRadius: 10, fontSize: "0.8125rem", fontWeight: 700, border: "none", cursor: "pointer",
              background: mode === m ? "rgba(255,255,255,0.08)" : "transparent",
              color: mode === m ? "var(--text-primary)" : "var(--text-secondary)",
              transition: "all 0.15s",
              textTransform: "capitalize",
            }}>{m}</button>
          ))}
        </div>

        <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className="sp-select">
          <option value="all">All sports</option>
          {filteredSports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="sp-select">
          <option value="points">Sort: Points</option>
          <option value="winRate">Sort: Win Rate</option>
          <option value="goalsFor">{mode === "teams" ? "Sort: Goals Scored" : "Sort: Points Scored"}</option>
          <option value="played">Sort: Most Active</option>
        </select>
      </div>

      {/* Table */}
      {isEmpty ? (
        <div className="sp-card" style={{ padding: "64px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: 12 }}>🏆</p>
          <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>No completed matches yet</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 6 }}>Play some matches to see standings here.</p>
        </div>
      ) : mode === "teams" ? (
        sportFilter !== "all" ? <TeamTable rows={filteredTeams} /> :
        teamGroups ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {Object.entries(teamGroups).map(([sport, rows]) => (
              <div key={sport}>
                <h2 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 18, background: "var(--accent)", borderRadius: 3, display: "inline-block" }} />{sport}
                </h2>
                <TeamTable rows={rows} />
              </div>
            ))}
          </div>
        ) : <TeamTable rows={filteredTeams} />
      ) : (
        sportFilter !== "all" ? <PlayerTable rows={filteredPlayers} /> :
        playerGroups ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {Object.entries(playerGroups).map(([sport, rows]) => (
              <div key={sport}>
                <h2 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 18, background: "#c084fc", borderRadius: 3, display: "inline-block" }} />{sport}
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