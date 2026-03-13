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
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  const teams = user?.player?.teams ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="text-2xl font-black tracking-tighter">
          SPORTS<span className="text-[#00ff87]">PORTAL</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{session.user?.name ?? session.user?.email}</span>
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
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold">
            Welcome back,{" "}
            <span className="text-[#00ff87]">{session.user?.name?.split(" ")[0] ?? "Athlete"}</span> 👋
          </h1>
          <p className="text-zinc-400 mt-1">Here's what's happening with your teams and events.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff87] inline-block" />
              Upcoming Events
            </h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-zinc-500 text-sm">No upcoming events. Create one below!</p>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((e) => (
                  <li key={e.id} className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{e.name}</p>
                      <p className="text-zinc-400 text-xs">
                        {new Date(e.start_time).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}{e.sport.name}
                      </p>
                    </div>
                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      e.event_type === "GAME"
                        ? "bg-blue-900/40 text-blue-400"
                        : e.event_type === "TOURNAMENT"
                        ? "bg-purple-900/40 text-purple-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {e.event_type.charAt(0) + e.event_type.slice(1).toLowerCase()}
                    </span>
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
              <p className="text-zinc-500 text-sm">You're not on any teams yet.</p>
            ) : (
              <ul className="space-y-3">
                {teams.map((t) => (
                  <li key={t.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-sm text-[#00ff87]">
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
            { label: "Events Organized", value: user?.organizedEvents?.length ?? 0 },
            { label: "Teams", value: teams.length },
            { label: "Upcoming", value: upcomingEvents.length },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-[#00ff87]">{s.value}</div>
              <div className="text-zinc-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-8 flex gap-3">
          <Link
            href="/dashboard/events/new"
            className="bg-[#00ff87] text-zinc-900 font-bold px-5 py-2.5 rounded-xl hover:bg-[#00e87a] transition text-sm"
          >
            + New Event
          </Link>
          <Link
            href="/dashboard/teams"
            className="bg-zinc-800 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-zinc-700 transition text-sm"
          >
            Browse Teams
          </Link>
        </div>
      </main>
    </div>
  );
}
