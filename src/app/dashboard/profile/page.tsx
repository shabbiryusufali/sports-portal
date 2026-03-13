import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfileData } from "./actions";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await getProfileData();

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
        <span className="text-sm text-zinc-300">Profile</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-1">Player Profile</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Complete your profile to join teams and participate in events.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-widest">
            Account
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Name</span>
              <span className="text-white">{user?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Email</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Username</span>
              <span className="text-white">@{user?.username}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-widest">
            {user?.player ? "Update Player Info" : "Set Up Player Profile"}
          </h2>
          {!user?.player && (
            <p className="text-zinc-500 text-sm mb-5">
              You need a player profile to join teams and participate in events.
            </p>
          )}
          <ProfileForm existing={user?.player ?? null} />
        </div>
      </main>
    </div>
  );
}
