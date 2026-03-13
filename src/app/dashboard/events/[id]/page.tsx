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

  const statusConfig = {
    SCHEDULED: { label: "Scheduled", class: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    ONGOING: { label: "Live", class: "text-[#00ff87] bg-[#00ff87]/10 border-[#00ff87]/20" },
    COMPLETED: { label: "Completed", class: "text-zinc-400 bg-zinc-800 border-zinc-700" },
    CANCELLED: { label: "Cancelled", class: "text-red-400 bg-red-500/10 border-red-500/20" },
  } as const satisfies Record<string, { label: string; class: string }>;

  const typeConfig = {
    PRACTICE: { label: "Practice", icon: "🏃", class: "text-zinc-400 bg-zinc-800" },
    GAME: { label: "Game", icon: "⚡", class: "text-blue-400 bg-blue-500/10" },
    TOURNAMENT: { label: "Tournament", icon: "🏆", class: "text-purple-400 bg-purple-500/10" },
  } as const satisfies Record<string, { label: string; icon: string; class: string }>;

  const sc = statusConfig[event.status as keyof typeof statusConfig];
  const tc = typeConfig[event.event_type as keyof typeof typeConfig];

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-[#080810]/90 border-b border-white/5 px-6 h-16 flex items-center gap-3">
        <Link href="/dashboard" className="text-zinc-500 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition text-sm"
>
          ← Dashboard
        </Link>
        <span className="text-white/10">/</span>
        <span className="text-sm text-zinc-300 font-medium truncate max-w-xs">{event.name}</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${sc.class}`}>
              {event.status === "ONGOING" && <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />}
              {sc.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${tc.class}`}>
              {tc.icon} {tc.label}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-1">{event.name}</h1>
          <p className="text-zinc-500">{event.sport.name}</p>
          {event.description && (
            <p className="text-zinc-400 text-sm mt-3 leading-relaxed max-w-2xl">{event.description}</p>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: "🗓",
              label: "Start",
              value: new Date(event.start_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
            },
            {
              icon: "⏱",
              label: "End",
              value: new Date(event.end_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
            },
            { icon: "📍", label: "Location", value: event.location ?? "TBD" },
            { icon: "👤", label: "Organizer", value: event.organizer.name ?? event.organizer.email },
          ].map((item) => (
            <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <p className="text-lg mb-1">{item.icon}</p>
              <p className="text-zinc-500 text-xs mb-1">{item.label}</p>
              <p className="text-sm font-semibold truncate">{item.value}</p>
            </div>
          ))}
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