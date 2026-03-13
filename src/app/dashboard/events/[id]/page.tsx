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
    SCHEDULED: {
      label: "Scheduled",
      class:
        "text-sky-300 bg-sky-500/10 border border-sky-400/20",
    },
    ONGOING: {
      label: "Live",
      class:
        "text-emerald-300 bg-emerald-500/10 border border-emerald-400/20",
    },
    COMPLETED: {
      label: "Completed",
      class:
        "text-zinc-300 bg-zinc-500/10 border border-white/10",
    },
    CANCELLED: {
      label: "Cancelled",
      class:
        "text-rose-300 bg-rose-500/10 border border-rose-400/20",
    },
  } as const satisfies Record<string, { label: string; class: string }>;

  const typeConfig = {
    PRACTICE: {
      label: "Practice",
      icon: "🏃",
      class: "text-zinc-200 bg-white/5 border border-white/10",
    },
    GAME: {
      label: "Game",
      icon: "⚡",
      class: "text-sky-300 bg-sky-500/10 border border-sky-400/20",
    },
    TOURNAMENT: {
      label: "Tournament",
      icon: "🏆",
      class: "text-violet-300 bg-violet-500/10 border border-violet-400/20",
    },
  } as const satisfies Record<string, { label: string; icon: string; class: string }>;

  const sc = statusConfig[event.status as keyof typeof statusConfig];
  const tc = typeConfig[event.event_type as keyof typeof typeConfig];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#0d1324] to-[#0a0f1d] text-white">
      <nav className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1020]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.07] hover:text-white"
          >
            ← Dashboard
          </Link>
          <span className="text-white/15">/</span>
          <span className="truncate text-sm text-zinc-400">{event.name}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-8">
          {/* Header */}
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
            <div className="bg-gradient-to-r from-white/[0.05] to-transparent px-8 py-8 sm:px-10 sm:py-10">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${sc.class}`}
                >
                  {event.status === "ONGOING" && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {sc.label}
                </span>

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${tc.class}`}
                >
                  <span>{tc.icon}</span>
                  <span>{tc.label}</span>
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                {event.name}
              </h1>

              <p className="mt-2 text-base text-zinc-400 sm:text-lg">
                {event.sport.name}
              </p>

              {event.description && (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
                  {event.description}
                </p>
              )}
            </div>
          </section>

          {/* Meta grid */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: "🗓",
                label: "Start",
                value: new Date(event.start_time).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              },
              {
                icon: "⏱",
                label: "End",
                value: new Date(event.end_time).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              },
              {
                icon: "📍",
                label: "Location",
                value: event.location ?? "TBD",
              },
              {
                icon: "👤",
                label: "Organizer",
                value: event.organizer.name ?? event.organizer.email,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition hover:bg-white/[0.06]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-lg">
                  {item.icon}
                </div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {item.label}
                </p>
                <p className="text-sm font-semibold leading-6 text-zinc-100">
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          {/* Interactive section */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)] sm:p-6">
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
          </section>
        </div>
      </main>
    </div>
  );
}