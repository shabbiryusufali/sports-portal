"use client";
import { useState, useEffect, Suspense } from "react";
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

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStage("invalid");
      return;
    }
    validateResetToken(token).then(({ valid, email: e }) => {
      if (!valid) {
        setStage("invalid");
      } else {
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
          {/* Loading */}
          {stage === "loading" && (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">Validating your link…</p>
            </div>
          )}

          {/* Invalid / expired */}
          {stage === "invalid" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl mx-auto mb-5">
                ⛔
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                Link invalid or expired
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                This password reset link has already been used or has expired.
                Reset links are valid for 1 hour.
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-block bg-[#00ff87] text-zinc-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#00e87a] transition"
              >
                Request a new link
              </Link>
            </div>
          )}

          {/* Form */}
          {stage === "form" && (
            <>
              <h1 className="text-xl font-bold text-white mb-2">
                Create new password
              </h1>
              {email && (
                <p className="text-zinc-400 text-sm mb-6">
                  Setting a new password for{" "}
                  <span className="text-white font-medium">{email}</span>.
                </p>
              )}

              {error && (
                <div className="mb-5 bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-zinc-400 mb-1.5"
                  >
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
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00ff87] transition"
                    placeholder="Min. 8 characters"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-xs font-medium text-zinc-400 mb-1.5"
                  >
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
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00ff87] transition"
                    placeholder="Repeat password"
                  />
                  {confirm && password !== confirm && (
                    <p className="mt-1.5 text-xs text-red-400">
                      Passwords do not match.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (!!confirm && password !== confirm)}
                  className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating…" : "Update Password"}
                </button>
              </form>
            </>
          )}

          {/* Success */}
          {stage === "success" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00ff87]/10 border border-[#00ff87]/20 flex items-center justify-center text-2xl mx-auto mb-5">
                ✅
              </div>
              <h2 className="text-lg font-bold text-white mb-2">
                Password updated!
              </h2>
              <p className="text-zinc-400 text-sm">
                Your password has been changed. Redirecting to sign in…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
