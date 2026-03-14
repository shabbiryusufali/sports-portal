"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="inline-block text-4xl font-black tracking-tighter text-white">
            SPORTS<span className="text-[#00ff87]">PORTAL</span>
          </span>
          <p className="mt-2 text-zinc-400 text-sm">
            Manage your teams, events, and matches.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {submitted ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00ff87]/10 border border-[#00ff87]/20 flex items-center justify-center text-2xl mx-auto mb-5">
                📧
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                Check your inbox
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                If an account exists for{" "}
                <span className="text-white font-medium">{email}</span>, you
                will receive a password reset link shortly. The link expires in
                1 hour.
              </p>
              <Link
                href="/auth/login"
                className="mt-6 inline-block text-sm text-[#00ff87] hover:underline"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Request form ── */
            <>
              <h1 className="text-xl font-bold text-white mb-2">
                Forgot password?
              </h1>
              <p className="text-zinc-400 text-sm mb-6">
                Enter the email address linked to your account and we'll send
                you a reset link.
              </p>

              {error && (
                <div className="mb-5 bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-zinc-400 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00ff87] transition"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <p className="text-center text-zinc-500 text-sm mt-6">
                Remembered it?{" "}
                <Link
                  href="/auth/login"
                  className="text-[#00ff87] hover:underline font-medium"
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