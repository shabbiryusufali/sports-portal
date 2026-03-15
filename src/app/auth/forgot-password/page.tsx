"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await requestPasswordReset(email.trim().toLowerCase());
    if (!result.success) {
      setError(result.message ?? "Something went wrong.");
    } else {
      setSubmitted(true);
    }
    setLoading(false);
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
          {submitted ? (
            /* ── Success state ── */
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
                📧
              </div>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: 10,
                }}
              >
                Check your inbox
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                }}
              >
                If an account exists for{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {email}
                </span>
                , you will receive a reset link shortly. It expires in 1 hour.
              </p>
              <Link
                href="/auth/login"
                style={{
                  display: "inline-block",
                  marginTop: 24,
                  fontSize: "0.875rem",
                  color: "var(--accent)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Request form ── */
            <>
              <h1
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}
              >
                Forgot password?
              </h1>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  marginBottom: 24,
                }}
              >
                Enter the email address linked to your account and we&apos;ll
                send you a reset link.
              </p>

              {error && (
                <div
                  className="sp-notice sp-notice-err"
                  style={{ marginBottom: 20 }}
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <label className="sp-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="sp-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="sp-btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "12px",
                  }}
                >
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  marginTop: 24,
                }}
              >
                Remembered it?{" "}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
