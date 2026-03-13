import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEventData } from "./actions";
import EventClient from "./EventClient";

interface Props {
  params: { id: string };
}

export default async function EventPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const data = await getEventData(params.id);
  if (!data) redirect("/dashboard");

  const { event, canManage, teamsInSport } = data;

  const statusColor = {
    SCHEDULED: "text-blue-400 bg-blue-900/30 border-blue-700/50",
    ONGOING: "text-green-400 bg-green-900/30 border-green-700/50",
    COMPLETED: "text-zinc-400 bg-zinc-800 border-zinc-700",
    CANCELLED: "text-red-400 bg-red-900/30 border-red-700/50",
  }[event.status];

  const typeColor = {
    PRACTICE: "text-zinc-400",
    GAME: "text-blue-400",
    TOURNAMENT: "text-purple-400",
  }[event.event_type];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white text-sm transition">
          ← Dashboard
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-zinc-300 truncate">{event.name}</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
                  {event.status}
                </span>
                <span className={`text-xs font-medium ${typeColor}`}>
                  {event.event_type.charAt(0) + event.event_type.slice(1).toLowerCase()}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight">{event.name}</h1>
              <p className="text-zinc-400 text-sm mt-1">{event.sport.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              {
                label: "Start",
                value: new Date(event.start_time).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              },
              {
                label: "End",
                value: new Date(event.end_time).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              },
              { label: "Location", value: event.location ?? "TBD" },
              { label: "Organizer", value: event.organizer.name ?? event.organizer.email },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                <p className="text-sm font-medium text-white truncate">{item.value}</p>
              </div>
            ))}
          </div>

          {event.description && (
            <p className="mt-4 text-zinc-400 text-sm leading-relaxed">{event.description}</p>
          )}
        </div>

        {/* Interactive section */}
        <EventClient
          event={{
            id: event.id,
            status: event.status,
            sport_id: event.sport_id,
            participants: event.participants.map((t) => ({
              id: t.id,
              name: t.name,
              _count: t._count,
            })),
            matches: event.matches.map((m) => ({
              id: m.id,
              status: m.status,
              match_type: m.match_type,
              match_date: m.match_date.toISOString(),
              score_team_a: m.score_team_a,
              score_team_b: m.score_team_b,
              team_a: { id: m.team_a.id, name: m.team_a.name },
              team_b: { id: m.team_b.id, name: m.team_b.name },
            })),
          }}
          canManage={canManage}
          teamsInSport={teamsInSport.map((t) => ({ id: t.id, name: t.name }))}
        />
      </main>
    </div>
  );
}