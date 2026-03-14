import { auth } from "@/api/auth/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import EventsClient from "./EventsClient";

export default async function EventsPage() {
  const session = await auth();

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
    <div style={{ padding: "32px 32px 40px", maxWidth: 1200, width: "100%" }}>
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Events</h1>
          <p className="sp-page-subtitle">Browse all events across every sport.</p>
        </div>
        <Link href="/dashboard/events/new" className="sp-btn-primary">+ New Event</Link>
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
        currentUserId={session?.user?.id ?? ""}
      />
    </div>
  );
}