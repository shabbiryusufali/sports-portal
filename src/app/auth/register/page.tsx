import { auth } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import RegisterForm from "./RegisterForm";
import Link from "next/link";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="sp-auth-page">
      <div style={{ width: "100%", maxWidth: 420 }}>
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
            Create your account to get started.
          </p>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 20,
            padding: "32px",
          }}
        >
          <RegisterForm />
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            marginTop: 20,
          }}
        >
          Already have an account?{" "}
          <Link
            href="/auth/login"
            style={{
              color: "var(--accent)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
