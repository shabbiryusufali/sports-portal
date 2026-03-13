import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import EventForm from "@/app/events/EventForm";
import Link from "next/link";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  // Get teams the user is a captain of (so they can schedule events)
  const player = await prisma.player.findUnique({
    where: { id: session.user.id },
    include: {
      captainOf: { include: { sport: true } },
      teams: { include: { sport: true } },
    },
  });

  const manageableTeams = player?.captainOf ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-zinc-400 hover:text-white text-sm transition"
        >
          ← Dashboard
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-zinc-300">New Event</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-1">Create New Event</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Schedule a practice, game, or tournament for one of your teams.
        </p>

        {manageableTeams.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-400 text-sm mb-4">
              You need to be a team captain to create events.
            </p>
            <Link
              href="/dashboard/teams"
              className="inline-block bg-[#00ff87] text-zinc-900 font-bold px-5 py-2.5 rounded-xl hover:bg-[#00e87a] transition text-sm"
            >
              Browse Teams
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {manageableTeams.map((team) => (
              <div
                key={team.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-sm text-[#00ff87]">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{team.name}</p>
                    <p className="text-zinc-400 text-xs">{team.sport.name}</p>
                  </div>
                </div>
                <EventForm teamId={team.id} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
