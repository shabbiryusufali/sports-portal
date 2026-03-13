import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center max-w-xl">
        <h1 className="text-6xl font-black tracking-tighter mb-4">
          SPORTS<span className="text-[#00ff87]">PORTAL</span>
        </h1>
        <p className="text-zinc-400 text-lg mb-10">
          Manage teams, schedule events, and track matches — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="bg-[#00ff87] text-zinc-900 font-bold px-8 py-3 rounded-xl hover:bg-[#00e87a] transition"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="bg-zinc-800 text-white font-semibold px-8 py-3 rounded-xl hover:bg-zinc-700 transition border border-zinc-700"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
