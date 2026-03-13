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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white text-sm transition">
          ← Dashboard
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-zinc-300">New Event</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-1">Create New Event</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Schedule a practice, game, or tournament. Teams are optional — add them after.
        </p>

        <NewEventClient
          sports={sports}
          captainOfTeams={player?.captainOf ?? []}
        />
      </main>
    </div>
  );
}