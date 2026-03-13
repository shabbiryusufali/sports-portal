import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeamsData, getSports } from "./actions";
import TeamsClient from "./TeamsClient";

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [data, sports] = await Promise.all([getTeamsData(), getSports()]);

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
        <span className="text-sm text-zinc-300">Teams</span>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Teams</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Browse all teams or create your own.
            </p>
          </div>
        </div>

        <TeamsClient
          teams={data?.allTeams ?? []}
          memberTeamIds={Array.from(data?.memberTeamIds ?? [])}
          sports={sports}
          userId={session.user.id!}
        />
      </main>
    </div>
  );
}
