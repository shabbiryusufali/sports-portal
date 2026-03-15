"use client";

import { useState } from "react";
import { registerWithCredentials } from "./actions";
import Link from "next/link";

export default function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await registerWithCredentials(form);
    setLoading(false);
    if (!result.success) setError(result.message ?? "Registration failed.");
    else {
      setSubmittedEmail(form.email);
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: "3rem" }}>📬</div>
        <div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Check your email
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              lineHeight: 1.6,
            }}
          >
            We sent a verification link to
          </p>
          <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginTop: 4 }}>
            {submittedEmail}
          </p>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.8125rem",
              marginTop: 8,
            }}
          >
            Click the link to activate your account. It expires in 24 hours.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="sp-btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 18 }}
    >
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        Create account
      </h1>
      {error && (
        <div
          className="sp-notice sp-notice-err"
          style={{ fontSize: "0.875rem" }}
        >
          ✕ {error}
        </div>
      )}
      <div>
        <label className="sp-label" htmlFor="name">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          placeholder="Alex Johnson"
          className="sp-input"
        />
      </div>
      <div>
        <label className="sp-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className="sp-input"
        />
      </div>
      <div>
        <label className="sp-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={handleChange}
          placeholder="Min. 8 characters"
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
          fontSize: "0.9375rem",
          marginTop: 4,
        }}
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
