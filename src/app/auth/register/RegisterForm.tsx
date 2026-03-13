"use client";
import { useState } from "react";
// Update the path below to the correct relative location of your actions file
import { registerWithCredentials } from "./actions";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await registerWithCredentials(form);
      if (!result.success)
        throw new Error(result.message || "Registration failed");
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-white font-semibold">Account created!</p>
        <p className="text-zinc-400 text-sm mt-1">
          Redirecting you to sign in…
        </p>
      </div>
    );
  }

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
          <label
            className="block text-xs font-medium text-zinc-400 mb-1.5"
            htmlFor="name"
          >
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
          <label
            className="block text-xs font-medium text-zinc-400 mb-1.5"
            htmlFor="email"
          >
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
          <label
            className="block text-xs font-medium text-zinc-400 mb-1.5"
            htmlFor="password"
          >
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
          className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Creating account…" : "Sign Up"}
        </button>
      </div>
    </form>
  );
}
