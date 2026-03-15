import { prisma } from "@/lib/db";
import LeaderboardsClient from "./LeaderboardsClient";

function calcPoints(
  wins: number,
  draws: number,
  otWins: number,
  otLosses: number,
): number {
  return wins * 3 + draws + otWins * 2 + otLosses * 1;
}

export default async function LeaderboardsPage() {
  const [sports, teams, players] = await Promise.all([
    prisma.sport.findMany({ orderBy: { name: "asc" } }),
    prisma.team.findMany({
      where: { is_active: true },
      include: {
        sport: true,
        _count: { select: { members: true } },
        matchesAsTeamA: {
          where: { status: "COMPLETED" },
          select: { score_team_a: true, score_team_b: true, result_type: true },
        },
        matchesAsTeamB: {
          where: { status: "COMPLETED" },
          select: { score_team_a: true, score_team_b: true, result_type: true },
        },
      },
    }),
    prisma.player.findMany({
      include: {
        user: { select: { name: true } },
        matchesAsPlayerA: {
          where: { status: "COMPLETED" },
          select: {
            score_team_a: true,
            score_team_b: true,
            result_type: true,
            sport: { select: { id: true, name: true, is_team_sport: true } },
          },
        },
        matchesAsPlayerB: {
          where: { status: "COMPLETED" },
          select: {
            score_team_a: true,
            score_team_b: true,
            result_type: true,
            sport: { select: { id: true, name: true, is_team_sport: true } },
          },
        },
      },
    }),
  ]);

  const isOT = (m: { result_type: string }) =>
    m.result_type === "OVERTIME" || m.result_type === "TIEBREAKER";

  const teamsWithStats = teams.map((team) => {
    const asA = team.matchesAsTeamA;
    const asB = team.matchesAsTeamB;
    const wins =
      asA.filter((m) => !isOT(m) && m.score_team_a > m.score_team_b).length +
      asB.filter((m) => !isOT(m) && m.score_team_b > m.score_team_a).length;
    const losses =
      asA.filter((m) => !isOT(m) && m.score_team_a < m.score_team_b).length +
      asB.filter((m) => !isOT(m) && m.score_team_b < m.score_team_a).length;
    const draws =
      asA.filter((m) => !isOT(m) && m.score_team_a === m.score_team_b).length +
      asB.filter((m) => !isOT(m) && m.score_team_b === m.score_team_a).length;
    const otWins =
      asA.filter((m) => isOT(m) && m.score_team_a > m.score_team_b).length +
      asB.filter((m) => isOT(m) && m.score_team_b > m.score_team_a).length;
    const otLosses =
      asA.filter((m) => isOT(m) && m.score_team_a < m.score_team_b).length +
      asB.filter((m) => isOT(m) && m.score_team_b < m.score_team_a).length;
    const played = asA.length + asB.length;
    const goalsFor =
      asA.reduce((s, m) => s + m.score_team_a, 0) +
      asB.reduce((s, m) => s + m.score_team_b, 0);
    const goalsAgainst =
      asA.reduce((s, m) => s + m.score_team_b, 0) +
      asB.reduce((s, m) => s + m.score_team_a, 0);
    return {
      id: team.id,
      name: team.name,
      sport: team.sport,
      memberCount: team._count.members,
      played,
      wins,
      losses,
      draws,
      points: calcPoints(wins, draws, otWins, otLosses),
      goalsFor,
      goalsAgainst,
      goalDiff: goalsFor - goalsAgainst,
      winRate: played > 0 ? wins / played : 0,
    };
  });

  const playersWithStats = players
    .map((player) => {
      const asA = player.matchesAsPlayerA;
      const asB = player.matchesAsPlayerB;
      if (asA.length + asB.length === 0) return null;
      const wins =
        asA.filter((m) => !isOT(m) && m.score_team_a > m.score_team_b).length +
        asB.filter((m) => !isOT(m) && m.score_team_b > m.score_team_a).length;
      const losses =
        asA.filter((m) => !isOT(m) && m.score_team_a < m.score_team_b).length +
        asB.filter((m) => !isOT(m) && m.score_team_b < m.score_team_a).length;
      const draws =
        asA.filter((m) => !isOT(m) && m.score_team_a === m.score_team_b)
          .length +
        asB.filter((m) => !isOT(m) && m.score_team_b === m.score_team_a).length;
      const otWins =
        asA.filter((m) => isOT(m) && m.score_team_a > m.score_team_b).length +
        asB.filter((m) => isOT(m) && m.score_team_b > m.score_team_a).length;
      const otLosses =
        asA.filter((m) => isOT(m) && m.score_team_a < m.score_team_b).length +
        asB.filter((m) => isOT(m) && m.score_team_b < m.score_team_a).length;
      const played = asA.length + asB.length;
      const scoresFor =
        asA.reduce((s, m) => s + m.score_team_a, 0) +
        asB.reduce((s, m) => s + m.score_team_b, 0);
      const scoresAgainst =
        asA.reduce((s, m) => s + m.score_team_b, 0) +
        asB.reduce((s, m) => s + m.score_team_a, 0);
      const allSports = [
        ...asA.map((m) => m.sport),
        ...asB.map((m) => m.sport),
      ];
      const sportCounts: Record<string, number> = {};
      allSports.forEach((s) => {
        sportCounts[s.id] = (sportCounts[s.id] ?? 0) + 1;
      });
      const primarySportId = Object.entries(sportCounts).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0];
      const primarySport = allSports.find((s) => s.id === primarySportId) ?? {
        id: "unknown",
        name: "Individual",
        is_team_sport: false,
      };
      return {
        id: player.id,
        name: `${player.first_name} ${player.last_name}`,
        sport: {
          id: primarySport.id,
          name: primarySport.name,
          is_team_sport: primarySport.is_team_sport,
        },
        played,
        wins,
        losses,
        draws,
        points: calcPoints(wins, draws, otWins, otLosses),
        scoresFor,
        scoresAgainst,
        scoreDiff: scoresFor - scoresAgainst,
        winRate: played > 0 ? wins / played : 0,
      };
    })
    .filter(Boolean) as any[];

  return (
    <div style={{ padding: "32px 32px 40px", maxWidth: 1100, width: "100%" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="sp-page-title">Leaderboards</h1>
        <p className="sp-page-subtitle">
          Points: Normal W=3 D=1 L=0 · Overtime/Tiebreaker W=2 L=1
        </p>
      </div>

      <LeaderboardsClient
        teams={teamsWithStats}
        players={playersWithStats}
        sports={sports}
      />
    </div>
  );
}
