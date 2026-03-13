import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminData } from "./actions";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const data = await getAdminData();
  if (!data) redirect("/dashboard"); // not admin

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white text-sm transition">
          ← Dashboard
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-zinc-300">Admin</span>
        <span className="ml-auto text-xs text-amber-400 border border-amber-700/40 bg-amber-900/20 px-2 py-0.5 rounded-full font-semibold">
          Admin
        </span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-1">Admin Panel</h1>
        <p className="text-zinc-400 text-sm mb-8">Manage sports, view platform stats.</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Users", value: data.userCount },
            { label: "Total Events", value: data.eventCount },
            { label: "Total Teams", value: data.teamCount },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
              <p className="text-3xl font-black text-[#00ff87]">{s.value}</p>
              <p className="text-zinc-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <AdminClient sports={data.sports.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          is_team_sport: s.is_team_sport,
          _count: s._count,
        }))} />
      </main>
    </div>
  );
}