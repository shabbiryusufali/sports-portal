import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import RegisterForm from "./RegisterForm";
import Link from "next/link";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-block text-4xl font-black tracking-tighter text-white"
          >
            SPORTS<span className="text-[#00ff87]">PORTAL</span>
          </Link>
          <p className="mt-2 text-zinc-400 text-sm">
            Create your account to get started.
          </p>
        </div>
        <RegisterForm />
        <p className="text-center text-zinc-500 text-sm mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[#00ff87] hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
