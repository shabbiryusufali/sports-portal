import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import LeaderboardsClient from "./LeaderboardsClient";

export default async function LeaderboardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [sports, teams, players] = await Promise.all([
    prisma.sport.findMany({ orderBy: { name: "asc" } }),

    prisma.team.findMany({
      where: { is_active: true },
      include: {
        sport: true,
        _count: { select: { members: true } },
        matchesAsTeamA: {
          where: { status: "COMPLETED" },
          select: { score_team_a: true, score_team_b: true },
        },
        matchesAsTeamB: {
          where: { status: "COMPLETED" },
          select: { score_team_a: true, score_team_b: true },
        },
      },
    }),

    // Fetch all players with their individual sport matches
    prisma.player.findMany({
      include: {
        matchesAsPlayerA: {
          where: { status: "COMPLETED" },
          select: {
            score_team_a: true,
            score_team_b: true,
            sport: { select: { id: true, name: true } },
          },
        },
        matchesAsPlayerB: {
          where: { status: "COMPLETED" },
          select: {
            score_team_a: true,
            score_team_b: true,
            sport: { select: { id: true, name: true } },
          },
        },
        user: { select: { name: true } },
      },
    }),
  ]);

  // Compute stats per team
  const teamsWithStats = teams.map((team) => {
    const asA = team.matchesAsTeamA;
    const asB = team.matchesAsTeamB;

    const wins   = asA.filter((m) => m.score_team_a > m.score_team_b).length
                 + asB.filter((m) => m.score_team_b > m.score_team_a).length;
    const losses = asA.filter((m) => m.score_team_a < m.score_team_b).length
                 + asB.filter((m) => m.score_team_b < m.score_team_a).length;
    const draws  = asA.filter((m) => m.score_team_a === m.score_team_b).length
                 + asB.filter((m) => m.score_team_a === m.score_team_b).length;
    const played = wins + losses + draws;
    const points = wins * 3 + draws;
    const goalsFor     = asA.reduce((s, m) => s + m.score_team_a, 0)
                       + asB.reduce((s, m) => s + m.score_team_b, 0);
    const goalsAgainst = asA.reduce((s, m) => s + m.score_team_b, 0)
                       + asB.reduce((s, m) => s + m.score_team_a, 0);
    const goalDiff = goalsFor - goalsAgainst;
    const winRate  = played > 0 ? Math.round((wins / played) * 100) : 0;

    return {
      id: team.id,
      name: team.name,
      sport: team.sport,
      memberCount: team._count.members,
      played, wins, losses, draws, points,
      goalsFor, goalsAgainst, goalDiff, winRate,
    };
  });

  // Compute stats per player (individual sport matches only)
  const playersWithStats = players.map((player) => {
    const asA = player.matchesAsPlayerA;
    const asB = player.matchesAsPlayerB;

    // score_team_a = player A's score, score_team_b = player B's score
    const wins   = asA.filter((m) => m.score_team_a > m.score_team_b).length
                 + asB.filter((m) => m.score_team_b > m.score_team_a).length;
    const losses = asA.filter((m) => m.score_team_a < m.score_team_b).length
                 + asB.filter((m) => m.score_team_b < m.score_team_a).length;
    const draws  = asA.filter((m) => m.score_team_a === m.score_team_b).length
                 + asB.filter((m) => m.score_team_a === m.score_team_b).length;
    const played = wins + losses + draws;
    const points = wins * 3 + draws;
    const scoresFor     = asA.reduce((s, m) => s + m.score_team_a, 0)
                        + asB.reduce((s, m) => s + m.score_team_b, 0);
    const scoresAgainst = asA.reduce((s, m) => s + m.score_team_b, 0)
                        + asB.reduce((s, m) => s + m.score_team_a, 0);
    const scoreDiff = scoresFor - scoresAgainst;
    const winRate   = played > 0 ? Math.round((wins / played) * 100) : 0;

    // A player may have played across multiple individual sports — pick the
    // most-played one as the "primary" sport for filtering purposes.
    const sportCounts: Record<string, { id: string; name: string; count: number }> = {};
    [...asA, ...asB].forEach((m) => {
      const s = m.sport;
      if (!sportCounts[s.id]) sportCounts[s.id] = { ...s, count: 0 };
      sportCounts[s.id].count++;
    });
    const primarySport = Object.values(sportCounts).sort((a, b) => b.count - a.count)[0]
      ?? { id: "unknown", name: "Unknown" };

    return {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      displayName: player.user?.name ?? `${player.first_name} ${player.last_name}`,
      sport: { id: primarySport.id, name: primarySport.name },
      played, wins, losses, draws, points,
      scoresFor, scoresAgainst, scoreDiff, winRate,
    };
  });

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-[#080810]/90 border-b border-white/5 px-6 h-16 flex items-center gap-4">
        <Link href="/dashboard" className="text-zinc-500 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition text-sm">
          ← Dashboard
        </Link>
        <span className="text-white/10">/</span>
        <span className="text-sm text-zinc-300 font-medium">Leaderboards</span>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Leaderboards</h1>
          <p className="text-zinc-500">Standings ranked by points (W=3, D=1, L=0).</p>
        </div>

        <LeaderboardsClient
          teams={teamsWithStats}
          players={playersWithStats}
          sports={sports}
        />
      </main>
    </div>
  );
}