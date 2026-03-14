import { prisma } from "@/lib/db";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;

  // ── No token in URL ───────────────────────────────────────────────────────
  if (!token) {
    return <Result
      icon="❌"
      title="Invalid link"
      message="This verification link is missing a token. Please check your email and try again."
      action={{ href: "/auth/login", label: "Back to sign in" }}
    />;
  }

  // ── Look up token ─────────────────────────────────────────────────────────
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return <Result
      icon="❌"
      title="Link already used or invalid"
      message="This verification link has already been used or doesn't exist. If your account is already verified, just sign in."
      action={{ href: "/auth/login", label: "Sign in" }}
    />;
  }

  if (record.expires < new Date()) {
    // Clean up expired token
    await prisma.verificationToken.delete({ where: { token } });
    return <Result
      icon="⏰"
      title="Link expired"
      message="This verification link expired after 24 hours. Please register again to receive a new one."
      action={{ href: "/auth/register", label: "Register again" }}
    />;
  }

  // ── Mark email as verified ────────────────────────────────────────────────
  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });

  // Burn the token
  await prisma.verificationToken.delete({ where: { token } });

  return <Result
    icon="✅"
    title="Email verified!"
    message="Your email address has been confirmed. You can now sign in to your account."
    action={{ href: "/auth/login", label: "Sign in now" }}
    success
  />;
}

// ── Shared result UI ──────────────────────────────────────────────────────────

function Result({
  icon,
  title,
  message,
  action,
  success = false,
}: {
  icon: string;
  title: string;
  message: string;
  action: { href: string; label: string };
  success?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <span className="inline-block text-4xl font-black tracking-tighter text-white">
              SPORTS<span className="text-[#00ff87]">PORTAL</span>
            </span>
          </Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-5xl mb-4">{icon}</div>
          <h1 className="text-xl font-bold text-white mb-3">{title}</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">{message}</p>
          <Link
            href={action.href}
            className={`inline-block w-full font-bold py-2.5 rounded-xl transition text-sm ${
              success
                ? "bg-[#00ff87] text-zinc-900 hover:bg-[#00e87a]"
                : "bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            {action.label}
          </Link>
        </div>
      </div>
    </div>
  );
}