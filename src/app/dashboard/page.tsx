import { auth, signOut } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import { getDashboardData } from "./actions";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const user = await getDashboardData();

  const upcomingEvents = [
    ...(user?.organizedEvents ?? []),
    ...(user?.player?.events ?? []),
  ]
    .filter((e) => new Date(e.start_time) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    )
    .slice(0, 5);

  // Dedup by id
  const seen = new Set<string>();
  const dedupedEvents = upcomingEvents.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  const teams = user?.player?.teams ?? [];
  const hasPlayerProfile = !!user?.player;
  const isAdmin = (user as any)?.is_admin ?? false;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="text-2xl font-black tracking-tighter">
          SPORTS<span className="text-[#00ff87]">PORTAL</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/teams"
            className="text-sm text-zinc-400 hover:text-white transition hidden sm:block"
          >
            Teams
          </Link>
          <Link
            href="/dashboard/events/new"
            className="text-sm text-zinc-400 hover:text-white transition hidden sm:block"
          >
            New Event
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className="text-xs text-amber-400 border border-amber-700/40 bg-amber-900/20 px-2.5 py-1 rounded-full font-semibold hover:bg-amber-900/40 transition hidden sm:block"
            >
              Admin
            </Link>
          )}
          <Link
            href="/dashboard/profile"
            className="text-sm text-zinc-400 hover:text-white transition hidden sm:block"
          >
            Profile
          </Link>
          <span className="text-zinc-400 text-sm hidden sm:block">
            {session.user?.name ?? session.user?.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/login" });
            }}
          >
            <button className="text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-lg px-3 py-1.5 hover:border-zinc-500 transition">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Player profile nudge */}
        {!hasPlayerProfile && (
          <div className="mb-6 bg-amber-900/20 border border-amber-700/40 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-amber-400 text-sm">
                Complete your player profile
              </p>
              <p className="text-zinc-400 text-xs mt-0.5">
                You need a player profile to join teams and participate in events.
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="shrink-0 text-sm font-bold text-amber-400 border border-amber-700/40 px-4 py-2 rounded-xl hover:bg-amber-900/30 transition"
            >
              Set up →
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { href: "/dashboard/events/new", label: "New Event", icon: "＋", color: "text-[#00ff87]" },
            { href: "/dashboard/teams", label: "Teams", icon: "⚽", color: "text-blue-400" },
            { href: "/dashboard/profile", label: "Profile", icon: "👤", color: "text-purple-400" },
            ...(isAdmin ? [{ href: "/dashboard/admin", label: "Admin", icon: "⚙", color: "text-amber-400" }] : []),
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition flex items-center gap-3"
            >
              <span className={`text-xl ${action.color}`}>{action.icon}</span>
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff87] inline-block" />
              Upcoming Events
            </h2>
            {dedupedEvents.length === 0 ? (
              <div>
                <p className="text-zinc-500 text-sm mb-3">No upcoming events.</p>
                <Link
                  href="/dashboard/events/new"
                  className="text-[#00ff87] text-sm hover:underline font-medium"
                >
                  Create an event →
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {dedupedEvents.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/dashboard/events/${e.id}`}
                      className="flex items-center justify-between gap-3 hover:bg-zinc-800/50 rounded-xl px-2 py-2 -mx-2 transition group"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm group-hover:text-[#00ff87] transition truncate">
                          {e.name}
                        </p>
                        <p className="text-zinc-500 text-xs">
                          {new Date(e.start_time).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          e.event_type === "GAME"
                            ? "bg-blue-900/40 text-blue-400"
                            : e.event_type === "TOURNAMENT"
                            ? "bg-purple-900/40 text-purple-400"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {e.event_type.charAt(0) + e.event_type.slice(1).toLowerCase()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* My Teams */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff87] inline-block" />
              My Teams
            </h2>
            {teams.length === 0 ? (
              <div>
                <p className="text-zinc-500 text-sm mb-3">
                  You&apos;re not on any teams yet.
                </p>
                <Link
                  href="/dashboard/teams"
                  className="text-[#00ff87] text-sm hover:underline font-medium"
                >
                  Browse teams →
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {teams.map((t) => (
                  <li key={t.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-sm text-[#00ff87] shrink-0">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-zinc-400 text-xs">{t.sport.name}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            {
              label: "Events Organized",
              value: user?.organizedEvents?.length ?? 0,
            },
            {
              label: "Teams",
              value: teams.length,
            },
            {
              label: "Events Joined",
              value: user?.player?.events?.length ?? 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center"
            >
              <p className="text-3xl font-black text-[#00ff87]">{stat.value}</p>
              <p className="text-zinc-400 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}