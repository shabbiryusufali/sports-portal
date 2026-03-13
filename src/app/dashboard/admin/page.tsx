import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminData } from "./actions";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const data = await getAdminData();
  if (!data) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-[#080810]/90 border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-zinc-500 hover:text-white hover:bg-white/5 px-4 py-2.5 rounded-xl transition text-sm"
>
            ← Dashboard
          </Link>
          <span className="text-white/10">/</span>
          <span className="text-sm text-zinc-300 font-medium">Admin</span>
        </div>
        <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
          ⚙ Admin Panel
        </span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Admin Panel</h1>
          <p className="text-zinc-500">Manage sports and monitor platform activity.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Users", value: data.userCount, icon: "👥", color: "text-blue-400" },
            { label: "Total Events", value: data.eventCount, icon: "📅", color: "text-[#00ff87]" },
            { label: "Total Teams", value: data.teamCount, icon: "⚽", color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xl mb-3">{s.icon}</p>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <AdminClient
          sports={data.sports.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            is_team_sport: s.is_team_sport,
            _count: s._count,
          }))}
        />
      </main>
    </div>
  );
}