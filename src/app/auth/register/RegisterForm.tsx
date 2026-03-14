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

    if (!result.success) {
      setError(result.message ?? "Registration failed.");
    } else {
      setSubmittedEmail(form.email);
      setSuccess(true);
    }
  };

  // ── Success state: prompt user to check email ─────────────────────────────
  if (success) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-1">
          We sent a verification link to
        </p>
        <p className="text-white font-semibold text-sm mb-4">{submittedEmail}</p>
        <p className="text-zinc-500 text-xs mb-6">
          Click the link in the email to activate your account. It expires in 24 hours.
        </p>
        <Link
          href="/auth/login"
          className="inline-block w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition text-sm"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
    >
      <h1 className="text-xl font-bold text-white mb-6">Create account</h1>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00ff87] transition"
            placeholder="Alex Johnson"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00ff87] transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="password">
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
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00ff87] transition"
            placeholder="Min. 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </div>

      <p className="text-center text-zinc-500 text-sm mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-[#00ff87] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}