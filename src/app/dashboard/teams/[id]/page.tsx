import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeamDetail } from "./actions";

interface Props {
  params: { id: string };
}

export default async function TeamDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const data = await getTeamDetail(params.id);
  if (!data) redirect("/dashboard/teams");

  const { team, allMatches, stats, isMember, isCaptain } = data;

  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  const resultConfig = {
    W: { label: "W", class: "bg-[#00ff87]/10 text-[#00ff87] border-[#00ff87]/20" },
    L: { label: "L", class: "bg-red-500/10 text-red-400 border-red-500/20" },
    D: { label: "D", class: "bg-zinc-800 text-zinc-400 border-zinc-700" },
  } as const;

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-[#080810]/90 border-b border-white/5 px-6 h-16 flex items-center gap-4">
        <Link href="/dashboard/teams" className="text-zinc-500 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition text-sm">
          ← Teams
        </Link>
        <span className="text-white/10">/</span>
        <span className="text-sm text-zinc-300 font-medium truncate">{team.name}</span>
        {isCaptain && (
          <span className="ml-auto text-xs font-bold text-[#00ff87] bg-[#00ff87]/10 px-3 py-1.5 rounded-lg border border-[#00ff87]/20">
            Captain
          </span>
        )}
        {isMember && !isCaptain && (
          <span className="ml-auto text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
            Member
          </span>
        )}
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#00ff87]/10 flex items-center justify-center font-black text-xl text-[#00ff87] shrink-0">
            {team.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{team.name}</h1>
            <p className="text-zinc-500 mt-1">{team.sport.name} · {team.members.length} members</p>
            <p className="text-zinc-600 text-xs mt-1">
              Captain: {team.captain.user.name ?? team.captain.user.email}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Played",   value: stats.played,           color: "text-white" },
            { label: "Wins",     value: stats.wins,             color: "text-[#00ff87]" },
            { label: "Losses",   value: stats.losses,           color: "text-red-400" },
            { label: "Draws",    value: stats.draws,            color: "text-zinc-400" },
            { label: "Win Rate", value: `${winRate}%`,          color: winRate >= 50 ? "text-[#00ff87]" : "text-zinc-300" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-zinc-600 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Goals for/against */}
        {stats.played > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00ff87]/10 flex items-center justify-center text-[#00ff87] text-lg shrink-0">⚽</div>
              <div>
                <p className="text-2xl font-black text-[#00ff87]">{stats.totalGoalsFor}</p>
                <p className="text-zinc-500 text-xs">Goals For</p>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 text-lg shrink-0">🥅</div>
              <div>
                <p className="text-2xl font-black text-red-400">{stats.totalGoalsAgainst}</p>
                <p className="text-zinc-500 text-xs">Goals Against</p>
              </div>
            </div>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roster */}
          <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="font-bold flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-400 rounded-full inline-block" />
                Roster
                <span className="text-zinc-600 font-normal text-sm">({team.members.length})</span>
              </h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {team.members.map((member) => {
                const isCap = member.id === team.captain_id;
                return (
                  <div key={member.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400 shrink-0">
                      {(member.user.name ?? member.user.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-zinc-600 text-xs truncate">{member.user.email}</p>
                    </div>
                    {isCap && (
                      <span className="text-xs font-bold text-[#00ff87] bg-[#00ff87]/10 px-2.5 py-1 rounded-lg border border-[#00ff87]/20">
                        Captain
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent Events */}
          <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="font-bold flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-400 rounded-full inline-block" />
                Recent Events
              </h2>
            </div>
            {team.events.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-zinc-600 text-sm">No events yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {team.events.map((e) => (
                  <Link key={e.id} href={`/dashboard/events/${e.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.03] transition group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      e.event_type === "GAME" ? "bg-blue-500/10" :
                      e.event_type === "TOURNAMENT" ? "bg-purple-500/10" : "bg-zinc-800"
                    }`}>
                      {e.event_type === "GAME" ? "⚡" : e.event_type === "TOURNAMENT" ? "🏆" : "🏃"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm group-hover:text-[#00ff87] transition truncate">{e.name}</p>
                      <p className="text-zinc-600 text-xs">
                        {new Date(e.start_time).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      e.status === "ONGOING" ? "text-[#00ff87] bg-[#00ff87]/10 border-[#00ff87]/20" :
                      e.status === "COMPLETED" ? "text-zinc-400 bg-zinc-800 border-zinc-700" :
                      "text-blue-400 bg-blue-500/10 border-blue-500/20"
                    }`}>
                      {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Match History */}
        <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="font-bold flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#00ff87] rounded-full inline-block" />
              Match History
              <span className="text-zinc-600 font-normal text-sm">({allMatches.length})</span>
            </h2>
          </div>
          {allMatches.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-zinc-500 text-sm">No completed matches yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {allMatches.map((m) => {
                const rc = resultConfig[m.result as keyof typeof resultConfig];
                return (
                  <div key={m.id} className="flex items-center gap-5 px-6 py-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border shrink-0 ${rc.class}`}>
                      {rc.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">vs {m.opponent.name}</p>
                      {m.event && (
                        <Link href={`/dashboard/events/${m.event.id}`} className="text-xs text-zinc-600 hover:text-zinc-400 transition">
                          {m.event.name}
                        </Link>
                      )}
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
          )}
        </section>
      </main>
    </div>
  );
}