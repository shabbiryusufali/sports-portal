import { auth, signOut } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import { getDashboardData } from "./actions";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const user = await getDashboardData();

  const allEvents = [
    ...(user?.organizedEvents ?? []),
    ...(user?.player?.events ?? []),
  ];
  const seen = new Set<string>();
  const upcomingEvents = allEvents
    .filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return new Date(e.start_time) >= new Date();
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 6);

  const teams = user?.player?.teams ?? [];
  const hasPlayerProfile = !!user?.player;
  const isAdmin = (user as any)?.is_admin ?? false;
  const displayName = session.user?.name ?? session.user?.email ?? "Athlete";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-[#080810]/90 border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-black tracking-tighter">
          SPORTS<span className="text-[#00ff87]">PORTAL</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/events" className="text-sm text-zinc-400 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition hidden sm:block">
            Events
          </Link>
          <Link href="/dashboard/teams" className="text-sm text-zinc-400 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition hidden sm:block">
            Teams
          </Link>
          <Link href="/dashboard/leaderboards" className="text-sm text-zinc-400 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition hidden sm:block">
            Leaderboards
          </Link>
          <Link href="/dashboard/profile" className="text-sm text-zinc-400 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition hidden sm:block">
            Profile
          </Link>
          {isAdmin && (
            <Link href="/dashboard/admin" className="text-xs font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-4 py-2 rounded-xl transition ml-1 hidden sm:block">
              ⚙ Admin
            </Link>
          )}
          <div className="w-px h-5 bg-white/10 mx-3 hidden sm:block" />
          <form action={async () => { "use server"; await signOut({ redirectTo: "/auth/login" }); }}>
            <button className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition">
              <span className="w-7 h-7 rounded-full bg-[#00ff87]/20 text-[#00ff87] text-xs font-bold flex items-center justify-center">
                {initials}
              </span>
              <span className="hidden sm:block">Sign out</span>
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-zinc-500 text-sm mb-1">Welcome back</p>
            <h1 className="text-3xl font-black tracking-tight">{displayName}</h1>
          </div>
          <Link href="/dashboard/events/new" className="shrink-0 bg-[#00ff87] text-zinc-900 font-bold px-6 py-3 rounded-xl hover:bg-[#00e87a] active:scale-95 transition-all text-sm">
            + New Event
          </Link>
        </div>

        {/* Profile nudge */}
        {!hasPlayerProfile && (
          <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400">⚠</div>
              <div>
                <p className="font-semibold text-amber-400 text-sm">Complete your player profile</p>
                <p className="text-zinc-500 text-xs mt-0.5">Required to join teams and participate in events.</p>
              </div>
            </div>
            <Link href="/dashboard/profile" className="shrink-0 text-sm font-bold text-amber-400 border border-amber-400/30 px-5 py-2.5 rounded-xl hover:bg-amber-400/10 transition">
              Set up →
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Events Organized", value: user?.organizedEvents?.length ?? 0, icon: "📅", color: "text-[#00ff87]" },
            { label: "Teams", value: teams.length, icon: "⚽", color: "text-blue-400" },
            { label: "Events Joined", value: user?.player?.events?.length ?? 0, icon: "🏆", color: "text-purple-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xl mb-3">{stat.icon}</p>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-zinc-500 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#00ff87] rounded-full inline-block" />
                Upcoming Events
              </h2>
              <Link href="/dashboard/events/new" className="text-xs text-[#00ff87] hover:underline">+ New</Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-zinc-400 text-sm">No upcoming events</p>
                <Link href="/dashboard/events/new" className="inline-block mt-3 text-[#00ff87] text-sm hover:underline">Create one →</Link>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {upcomingEvents.map((e) => (
                  <Link key={e.id} href={`/dashboard/events/${e.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.03] transition group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      e.event_type === "GAME" ? "bg-blue-500/10" :
                      e.event_type === "TOURNAMENT" ? "bg-purple-500/10" : "bg-zinc-800"
                    }`}>
                      {e.event_type === "GAME" ? "⚡" : e.event_type === "TOURNAMENT" ? "🏆" : "🏃"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm group-hover:text-[#00ff87] transition truncate">{e.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {new Date(e.start_time).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}
                        {new Date(e.start_time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      e.event_type === "GAME" ? "bg-blue-500/10 text-blue-400" :
                      e.event_type === "TOURNAMENT" ? "bg-purple-500/10 text-purple-400" :
                      "bg-zinc-800 text-zinc-400"
                    }`}>
                      {e.event_type.charAt(0) + e.event_type.slice(1).toLowerCase()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* My Teams */}
          <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-400 rounded-full inline-block" />
                My Teams
              </h2>
              <Link href="/dashboard/teams" className="text-xs text-blue-400 hover:underline">Browse</Link>
            </div>
            {teams.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-4xl mb-3">⚽</p>
                <p className="text-zinc-400 text-sm">Not on any teams yet</p>
                <Link href="/dashboard/teams" className="inline-block mt-3 text-blue-400 text-sm hover:underline">Browse teams →</Link>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {teams.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#00ff87]/10 flex items-center justify-center font-black text-xs text-[#00ff87] shrink-0">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{t.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{t.sport.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}