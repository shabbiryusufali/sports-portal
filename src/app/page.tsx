import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="sp-auth-page" style={{ flexDirection: "column", gap: 0 }}>
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "60vw",
            height: "60vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,135,0.06) 0%, transparent 70%)",
            top: "-20vw",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <div
        style={{
          textAlign: "center",
          maxWidth: 560,
          width: "100%",
          position: "relative",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0,255,135,0.08)",
            border: "1px solid rgba(0,255,135,0.2)",
            borderRadius: 99,
            padding: "6px 16px",
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "inline-block",
            }}
            className="pulse-dot"
          />
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Sports Management Platform
          </span>
        </div>

        {/* Logo */}
        <h1
          style={{
            fontSize: "clamp(3rem, 10vw, 5.5rem)",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            marginBottom: 20,
            color: "var(--text-primary)",
          }}
        >
          SPORTS<span style={{ color: "var(--accent)" }}>PORTAL</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            color: "var(--text-secondary)",
            marginBottom: 40,
            lineHeight: 1.6,
            maxWidth: 420,
            margin: "0 auto 40px",
          }}
        >
          Manage teams, schedule events, and track every match result — all in
          one place.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/auth/login"
            className="sp-btn-primary"
            style={{ padding: "13px 28px", fontSize: "1rem" }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="sp-btn-secondary"
            style={{ padding: "13px 28px", fontSize: "1rem" }}
          >
            Create Account
          </Link>
        </div>

        {/* Feature chips */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 48,
          }}
        >
          {[
            "Team Management",
            "Event Scheduling",
            "Live Scores",
            "Leaderboards",
          ].map((f) => (
            <span
              key={f}
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "6px 14px",
                fontWeight: 500,
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
