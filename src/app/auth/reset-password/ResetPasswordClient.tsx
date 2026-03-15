"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { validateResetToken, resetPassword } from "./actions";

type Stage = "loading" | "invalid" | "form" | "success";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStage("invalid");
      return;
    }
    validateResetToken(token).then(({ valid, email: e }) => {
      if (!valid) setStage("invalid");
      else {
        setEmail(e ?? "");
        setStage("form");
      }
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await resetPassword(token, password, confirm);
    if (!result.success) {
      setError(result.message ?? "Something went wrong.");
      setLoading(false);
    } else {
      setStage("success");
      setTimeout(() => router.push("/auth/login"), 2500);
    }
  };

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
          }}
        >
          {/* Loading */}
          {stage === "loading" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Verifying link…
              </p>
            </div>
          )}

          {/* Invalid */}
          {stage === "invalid" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "rgba(248,113,113,0.07)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  margin: "0 auto 20px",
                }}
              >
                ❌
              </div>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: 10,
                }}
              >
                Link invalid or expired
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                This reset link has already been used or has expired. Reset links are valid for 1 hour.
              </p>
              <Link
                href="/auth/forgot-password"
                className="sp-btn-primary"
                style={{ display: "flex", justifyContent: "center", width: "100%", padding: "12px" }}
              >
                Request a new link
              </Link>
            </div>
          )}

          {/* Form */}
          {stage === "form" && (
            <>
              <h1
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}
              >
                Create new password
              </h1>
              {email && (
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    marginBottom: 24,
                  }}
                >
                  Setting a new password for{" "}
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                    {email}
                  </span>
                  .
                </p>
              )}

              {error && (
                <div className="sp-notice sp-notice-err" style={{ marginBottom: 20 }}>
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <label className="sp-label" htmlFor="password">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className="sp-input"
                  />
                </div>
                <div>
                  <label className="sp-label" htmlFor="confirm">
                    Confirm Password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    className="sp-input"
                  />
                  {confirm && password !== confirm && (
                    <p style={{ marginTop: 6, fontSize: "0.75rem", color: "#f87171" }}>
                      Passwords do not match.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || (!!confirm && password !== confirm)}
                  className="sp-btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "12px",
                    marginTop: 4,
                  }}
                >
                  {loading ? "Updating…" : "Update Password"}
                </button>
              </form>
            </>
          )}

          {/* Success */}
          {stage === "success" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "var(--accent-dim)",
                  border: "1px solid rgba(0,255,135,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  margin: "0 auto 20px",
                }}
              >
                ✅
              </div>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: 10,
                }}
              >
                Password updated!
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Your password has been changed. Redirecting to sign in…
              </p>
            </div>
          )}
        </div>

        {/* Footer link (only shown on form stage) */}
        {stage === "form" && (
          <p
            style={{
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginTop: 20,
            }}
          >
            Remembered it?{" "}
            <Link
              href="/auth/login"
              style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}