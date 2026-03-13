import { prisma } from "@/lib/db";
import EventForm from "./EventForm";

export const revalidate = 0; // live while iterating

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { start_time: "asc" },
  });
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Events</h1>
      <EventForm teamId="DEMO_TEAM" />
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id} className="border rounded p-3">
            <div className="font-semibold">{e.event_type}</div>
            <div>
              {new Date(e.start_time).toLocaleString()} →{" "}
              {new Date(e.end_time).toLocaleString()}
            </div>
            {e.notes && <div className="opacity-80">{e.notes}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
