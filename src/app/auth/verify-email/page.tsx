import { prisma } from "@/lib/db";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;

  // ── No token in URL ───────────────────────────────────────────────────────
  if (!token) {
    return (
      <Result
        icon="❌"
        title="Invalid link"
        message="This verification link is missing a token. Please check your email and try again."
        action={{ href: "/auth/login", label: "Back to sign in" }}
      />
    );
  }

  // ── Look up token ─────────────────────────────────────────────────────────
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return (
      <Result
        icon="❌"
        title="Link already used or invalid"
        message="This verification link has already been used or doesn't exist. If your account is already verified, just sign in."
        action={{ href: "/auth/login", label: "Sign in" }}
      />
    );
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return (
      <Result
        icon="⏰"
        title="Link expired"
        message="This verification link expired after 24 hours. Please register again to receive a new one."
        action={{ href: "/auth/register", label: "Register again" }}
      />
    );
  }

  // ── Mark email as verified ────────────────────────────────────────────────
  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { token } });

  return (
    <Result
      icon="✅"
      title="Email verified!"
      message="Your email address has been confirmed. You can now sign in to your account."
      action={{ href: "/auth/login", label: "Sign in now" }}
      success
    />
  );
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
    <div className="sp-auth-page">
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              fontSize: "2rem",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              textDecoration: "none",
              color: "var(--text-primary)",
            }}
          >
            SPORTS<span style={{ color: "var(--accent)" }}>PORTAL</span>
          </Link>
          <p
            style={{
              marginTop: 8,
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
            }}
          >
            Manage your teams, events, and matches.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 20,
            padding: "32px",
            textAlign: "center",
          }}
        >
          {/* Icon badge */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: success
                ? "var(--accent-dim)"
                : "rgba(248,113,113,0.07)",
              border: success
                ? "1px solid rgba(0,255,135,0.2)"
                : "1px solid rgba(248,113,113,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.625rem",
              margin: "0 auto 20px",
            }}
          >
            {icon}
          </div>

          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 10,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              marginBottom: 28,
            }}
          >
            {message}
          </p>

          <Link
            href={action.href}
            className={success ? "sp-btn-primary" : "sp-btn-secondary"}
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              padding: "12px",
            }}
          >
            {action.label}
          </Link>
        </div>
      </div>
    </div>
  );
}