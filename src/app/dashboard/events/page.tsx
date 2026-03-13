import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import EventsClient from "./EventsClient";

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [events, sports] = await Promise.all([
    prisma.event.findMany({
      orderBy: { start_time: "desc" },
      include: {
        sport: true,
        organizer: { select: { id: true, name: true, email: true } },
        participants: { select: { id: true, name: true } },
        _count: { select: { matches: true } },
      },
    }),
    prisma.sport.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-[#080810]/90 border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-zinc-500 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition text-sm">
            ← Dashboard
          </Link>
          <span className="text-white/10">/</span>
          <span className="text-sm text-zinc-300 font-medium">Events</span>
        </div>
        <Link
          href="/dashboard/events/new"
          className="bg-[#00ff87] text-zinc-900 font-bold px-5 py-2.5 rounded-xl hover:bg-[#00e87a] transition text-sm"
        >
          + New Event
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">Events</h1>
          <p className="text-zinc-500">Browse all events across every sport.</p>
        </div>

        <EventsClient
          events={events.map((e) => ({
            id: e.id,
            name: e.name,
            sport: e.sport,
            event_type: e.event_type,
            status: e.status,
            start_time: e.start_time.toISOString(),
            end_time: e.end_time.toISOString(),
            location: e.location,
            organizer: e.organizer,
            participants: e.participants,
            matchCount: e._count.matches,
          }))}
          sports={sports}
          currentUserId={session.user.id}
        />
      </main>
    </div>
  );
}