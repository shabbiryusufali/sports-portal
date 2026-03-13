import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import NewEventClient from "./NewEventClient";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [sports, player] = await Promise.all([
    prisma.sport.findMany({ orderBy: { name: "asc" } }),
    prisma.player.findUnique({
      where: { id: session.user.id },
      include: { captainOf: { include: { sport: true } } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-[#080810]/90 border-b border-white/5 px-6 h-16 flex items-center gap-3">
        <Link href="/dashboard" className="text-zinc-500 hover:text-white transition text-sm flex items-center gap-1.5">
          ← Dashboard
        </Link>
        <span className="text-white/10">/</span>
        <span className="text-sm text-zinc-300 font-medium">New Event</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">Create Event</h1>
          <p className="text-zinc-500">Schedule a practice, game, or tournament. Teams are optional.</p>
        </div>

        <NewEventClient
          sports={sports}
          captainOfTeams={player?.captainOf ?? []}
        />
      </main>
    </div>
  );
}