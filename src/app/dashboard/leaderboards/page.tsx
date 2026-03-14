import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import LeaderboardsClient from "./LeaderboardsClient";

// Points helper — respects result_type
// NORMAL:              W=3  D=1  L=0
// OVERTIME/TIEBREAKER: W=2  L=1  (no draws possible)
function calcPoints(
  wins: number, draws: number,
  otWins: number, otLosses: number,
): number {
  return wins * 3 + draws + otWins * 2 + otLosses * 1;
}

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
          select: { score_team_a: true, score_team_b: true, result_type: true, sport: { select: { id: true, name: true, is_team_sport: true } } },
        },
        matchesAsPlayerB: {
          where: { status: "COMPLETED" },
          select: { score_team_a: true, score_team_b: true, result_type: true, sport: { select: { id: true, name: true, is_team_sport: true } } },
        },
      },
    }),
  ]);

  // ── Team stats ──────────────────────────────────────────────────────────────
  const teamsWithStats = teams.map((team) => {
    const asA = team.matchesAsTeamA;
    const asB = team.matchesAsTeamB;

    const isOT = (m: { result_type: string }) => m.result_type === "OVERTIME" || m.result_type === "TIEBREAKER";

    const wins   = asA.filter((m) => !isOT(m) && m.score_team_a > m.score_team_b).length
                 + asB.filter((m) => !isOT(m) && m.score_team_b > m.score_team_a).length;
    const losses = asA.filter((m) => !isOT(m) && m.score_team_a < m.score_team_b).length
                 + asB.filter((m) => !isOT(m) && m.score_team_b < m.score_team_a).length;
    const draws  = asA.filter((m) => !isOT(m) && m.score_team_a === m.score_team_b).length
                 + asB.filter((m) => !isOT(m) && m.score_team_a === m.score_team_b).length;
    // OT wins/losses
    const otWins  = asA.filter((m) => isOT(m) && m.score_team_a > m.score_team_b).length
                  + asB.filter((m) => isOT(m) && m.score_team_b > m.score_team_a).length;
    const otLosses = asA.filter((m) => isOT(m) && m.score_team_a < m.score_team_b).length
                   + asB.filter((m) => isOT(m) && m.score_team_b < m.score_team_a).length;

    const played = wins + losses + draws + otWins + otLosses;
    const points = calcPoints(wins, draws, otWins, otLosses);
    const goalsFor     = asA.reduce((s, m) => s + m.score_team_a, 0) + asB.reduce((s, m) => s + m.score_team_b, 0);
    const goalsAgainst = asA.reduce((s, m) => s + m.score_team_b, 0) + asB.reduce((s, m) => s + m.score_team_a, 0);
    const goalDiff = goalsFor - goalsAgainst;
    const winRate  = played > 0 ? Math.round(((wins + otWins) / played) * 100) : 0;

    return {
      id: team.id, name: team.name,
      sport: { id: team.sport.id, name: team.sport.name, is_team_sport: team.sport.is_team_sport },
      memberCount: team._count.members,
      played, wins, losses, draws, points, goalsFor, goalsAgainst, goalDiff, winRate,
    };
  });

  // ── Player stats ────────────────────────────────────────────────────────────
  const playersWithStats = players.map((player) => {
    const asA = player.matchesAsPlayerA;
    const asB = player.matchesAsPlayerB;
    const isOT = (m: { result_type: string }) => m.result_type === "OVERTIME" || m.result_type === "TIEBREAKER";

    const wins   = asA.filter((m) => !isOT(m) && m.score_team_a > m.score_team_b).length
                 + asB.filter((m) => !isOT(m) && m.score_team_b > m.score_team_a).length;
    const losses = asA.filter((m) => !isOT(m) && m.score_team_a < m.score_team_b).length
                 + asB.filter((m) => !isOT(m) && m.score_team_b < m.score_team_a).length;
    const draws  = asA.filter((m) => !isOT(m) && m.score_team_a === m.score_team_b).length
                 + asB.filter((m) => !isOT(m) && m.score_team_a === m.score_team_b).length;
    const otWins  = asA.filter((m) => isOT(m) && m.score_team_a > m.score_team_b).length
                  + asB.filter((m) => isOT(m) && m.score_team_b > m.score_team_a).length;
    const otLosses = asA.filter((m) => isOT(m) && m.score_team_a < m.score_team_b).length
                   + asB.filter((m) => isOT(m) && m.score_team_b < m.score_team_a).length;

    const played = wins + losses + draws + otWins + otLosses;
    if (played === 0) return null;

    const points     = calcPoints(wins, draws, otWins, otLosses);
    const scoresFor     = asA.reduce((s, m) => s + m.score_team_a, 0) + asB.reduce((s, m) => s + m.score_team_b, 0);
    const scoresAgainst = asA.reduce((s, m) => s + m.score_team_b, 0) + asB.reduce((s, m) => s + m.score_team_a, 0);
    const scoreDiff = scoresFor - scoresAgainst;
    const winRate   = Math.round(((wins + otWins) / played) * 100);

    const sportCounts: Record<string, { id: string; name: string; is_team_sport: boolean; count: number }> = {};
    [...asA, ...asB].forEach((m) => {
      if (!sportCounts[m.sport.id]) sportCounts[m.sport.id] = { ...m.sport, count: 0 };
      sportCounts[m.sport.id].count++;
    });
    const primarySport = Object.values(sportCounts).sort((a, b) => b.count - a.count)[0]
      ?? { id: "unknown", name: "Individual", is_team_sport: false };

    return {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      sport: { id: primarySport.id, name: primarySport.name, is_team_sport: primarySport.is_team_sport },
      played, wins, losses, draws, points, scoresFor, scoresAgainst, scoreDiff, winRate,
    };
  }).filter(Boolean) as NonNullable<ReturnType<typeof players[0] extends never ? never : any>>[];

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-[#080810]/90 border-b border-white/5 px-6 h-16 flex items-center gap-4">
        <Link href="/dashboard" className="text-xl font-black tracking-tighter mr-2">
          SPORTS<span className="text-[#00ff87]">PORTAL</span>
        </Link>
        <span className="text-white/10">/</span>
        <span className="text-sm text-zinc-300 font-medium">Leaderboards</span>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Leaderboards</h1>
          <p className="text-zinc-500">Points: Normal W=3 D=1 L=0 · Overtime/Tiebreaker W=2 L=1</p>
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