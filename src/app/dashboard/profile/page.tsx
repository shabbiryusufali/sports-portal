import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      player: {
        include: {
          teams: {
            include: {
              sport: true,
              matchesAsTeamA: {
                where: { status: "COMPLETED" },
                include: { team_b: true, event: { select: { id: true, name: true } } },
                orderBy: { match_date: "desc" },
              },
              matchesAsTeamB: {
                where: { status: "COMPLETED" },
                include: { team_a: true, event: { select: { id: true, name: true } } },
                orderBy: { match_date: "desc" },
              },
            },
          },
          events: {
            orderBy: { start_time: "desc" },
            take: 10,
            include: { sport: true },
          },
        },
      },
    },
  });

  if (!user) redirect("/auth/login");

  // Build unified match history across all teams
  const allMatches = (user.player?.teams ?? []).flatMap((team) => [
    ...team.matchesAsTeamA.map((m) => ({
      id: m.id,
      teamName: team.name,
      opponent: m.team_b.name,
      scoreFor: m.score_team_a,
      scoreAgainst: m.score_team_b,
      result: m.score_team_a > m.score_team_b ? "W" : m.score_team_a < m.score_team_b ? "L" : "D",
      date: m.match_date,
      event: m.event,
      sport: team.sport.name,
    })),
    ...team.matchesAsTeamB.map((m) => ({
      id: m.id,
      teamName: team.name,
      opponent: m.team_a.name,
      scoreFor: m.score_team_b,
      scoreAgainst: m.score_team_a,
      result: m.score_team_b > m.score_team_a ? "W" : m.score_team_b < m.score_team_a ? "L" : "D",
      date: m.match_date,
      event: m.event,
      sport: team.sport.name,
    })),
  ]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

  const totalWins   = allMatches.filter((m) => m.result === "W").length;
  const totalLosses = allMatches.filter((m) => m.result === "L").length;
  const totalDraws  = allMatches.filter((m) => m.result === "D").length;
  const winRate     = allMatches.length > 0 ? Math.round((totalWins / allMatches.length) * 100) : 0;

  const recentForm = allMatches.slice(0, 5).reverse();

  const resultConfig = {
    W: { label: "W", class: "bg-[#00ff87]/10 text-[#00ff87] border-[#00ff87]/20" },
    L: { label: "L", class: "bg-red-500/10 text-red-400 border-red-500/20" },
    D: { label: "D", class: "bg-zinc-800 text-zinc-400 border-zinc-700" },
  } as const;

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-[#080810]/90 border-b border-white/5 px-6 h-16 flex items-center gap-4">
        <Link href="/dashboard" className="text-zinc-500 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition text-sm">
          ← Dashboard
        </Link>
        <span className="text-white/10">/</span>
        <span className="text-sm text-zinc-300 font-medium">Profile</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#00ff87]/10 flex items-center justify-center font-black text-2xl text-[#00ff87] shrink-0">
            {(user.name ?? user.email).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{user.name ?? user.username}</h1>
            <p className="text-zinc-500 mt-1">@{user.username} · {user.email}</p>
            {user.player && (
              <p className="text-zinc-600 text-xs mt-1">
                {user.player.first_name} {user.player.last_name}
                {" · "}
                {new Date(user.player.date_of_birth).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {/* Stats — only if player profile exists and has matches */}
        {user.player && allMatches.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Matches",  value: allMatches.length, color: "text-white" },
                { label: "Wins",     value: totalWins,         color: "text-[#00ff87]" },
                { label: "Losses",   value: totalLosses,       color: "text-red-400" },
                { label: "Win Rate", value: `${winRate}%`,     color: winRate >= 50 ? "text-[#00ff87]" : "text-zinc-300" },
              ].map((s) => (
                <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center">
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-zinc-600 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Form strip */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Recent Form</p>
              <div className="flex items-center gap-2">
                {recentForm.map((m, i) => {
                  const rc = resultConfig[m.result as keyof typeof resultConfig];
                  return (
                    <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border ${rc.class}`}>
                      {rc.label}
                    </div>
                  );
                })}
                {recentForm.length === 0 && <p className="text-zinc-600 text-sm">No recent matches</p>}
              </div>
            </div>
          </>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account & profile form */}
          <div className="space-y-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">Account</p>
              <div className="space-y-3">
                {[
                  { label: "Name",     value: user.name ?? "—" },
                  { label: "Email",    value: user.email },
                  { label: "Username", value: `@${user.username}` },
                  { label: "Member since", value: new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500 text-sm">{row.label}</span>
                    <span className="text-sm font-medium truncate max-w-48">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">
                {user.player ? "Player Info" : "Set Up Player Profile"}
              </p>
              {!user.player && (
                <p className="text-zinc-600 text-sm mb-5">Complete your profile to join teams and participate in events.</p>
              )}
              <ProfileForm existing={user.player ?? null} />
            </div>
          </div>

          {/* Teams + Events */}
          <div className="space-y-4">
            {/* My teams */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h2 className="font-bold flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-blue-400 rounded-full inline-block" />
                  My Teams
                </h2>
              </div>
              {(user.player?.teams ?? []).length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-zinc-600 text-sm">Not on any teams yet.</p>
                  <Link href="/dashboard/teams" className="inline-block mt-2 text-blue-400 text-sm hover:underline">Browse teams →</Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {user.player!.teams.map((t) => (
                    <Link key={t.id} href={`/dashboard/teams/${t.id}`}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.03] transition group">
                      <div className="w-9 h-9 rounded-xl bg-[#00ff87]/10 flex items-center justify-center font-black text-xs text-[#00ff87] shrink-0">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm group-hover:text-[#00ff87] transition truncate">{t.name}</p>
                        <p className="text-zinc-600 text-xs">{t.sport.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent events */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h2 className="font-bold flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-purple-400 rounded-full inline-block" />
                  Recent Events
                </h2>
              </div>
              {(user.player?.events ?? []).length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-zinc-600 text-sm">No events yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {user.player!.events.map((e) => (
                    <Link key={e.id} href={`/dashboard/events/${e.id}`}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.03] transition group">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-base shrink-0">🏃</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm group-hover:text-[#00ff87] transition truncate">{e.name}</p>
                        <p className="text-zinc-600 text-xs">{e.sport.name} · {new Date(e.start_time).toLocaleDateString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match history */}
        {allMatches.length > 0 && (
          <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="font-bold flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#00ff87] rounded-full inline-block" />
                Match History
                <span className="text-zinc-600 font-normal text-sm">({allMatches.length})</span>
              </h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {allMatches.map((m) => {
                const rc = resultConfig[m.result as keyof typeof resultConfig];
                return (
                  <div key={m.id} className="flex items-center gap-5 px-6 py-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border shrink-0 ${rc.class}`}>
                      {rc.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        <span className="text-zinc-400">{m.teamName}</span>
                        <span className="text-zinc-600 mx-1.5">vs</span>
                        {m.opponent}
                      </p>
                      <p className="text-zinc-600 text-xs">{m.sport}{m.event ? ` · ${m.event.name}` : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-lg tabular-nums">
                        <span className={m.result === "W" ? "text-[#00ff87]" : m.result === "L" ? "text-red-400" : "text-zinc-300"}>
                          {m.scoreFor}
                        </span>
                        <span className="text-zinc-700 mx-1">–</span>
                        <span className="text-zinc-400">{m.scoreAgainst}</span>
                      </p>
                      <p className="text-zinc-600 text-xs">
                        {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}