import { auth, signIn } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthError } from "next-auth";

// Map NextAuth error codes → human-readable messages shown in the UI.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  OAuthAccountNotLinked:
    "This email is already linked to another sign-in method.",
  OAuthSignin: "Could not sign in with Google. Please try again.",
  OAuthCallback: "OAuth callback error. Please try again.",
  Default: "Something went wrong. Please try again.",
};

interface Props {
  searchParams?: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const params = await (searchParams ?? Promise.resolve({error : ""}));
  const errorKey = params.error ?? "";
  const errorMsg = errorKey
    ? (AUTH_ERROR_MESSAGES[errorKey] ?? AUTH_ERROR_MESSAGES.Default)
    : null;

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
          <h1 className="text-xl font-bold text-white mb-6">Sign in</h1>

          {/* Error banner */}
          {errorMsg && (
            <div className="mb-5 bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Google */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-semibold py-2.5 rounded-xl hover:bg-zinc-100 transition mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-zinc-500 text-xs uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 h-px bg-zinc-700" />
          </div>

          {/* Credentials form ──────────────────────────────────────────────
              On failure NextAuth redirects back to /auth/login?error=<code>.
              We never throw from the action so Next.js never crashes the page.
          ─────────────────────────────────────────────────────────────────── */}
          <form
            action={async (formData: FormData) => {
              "use server";
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;

              try {
                await signIn("credentials", {
                  email,
                  password,
                  redirectTo: "/dashboard",
                });
              } catch (error) {
                // signIn throws a NEXT_REDIRECT for successful redirects — re-throw those.
                if (
                  error instanceof Error &&
                  (error as any).digest?.startsWith("NEXT_REDIRECT")
                ) {
                  throw error;
                }

                // Map NextAuth AuthError codes to URL-safe query params.
                if (error instanceof AuthError) {
                  const code =
                    error.type === "CredentialsSignin"
                      ? "CredentialsSignin"
                      : "Default";
                  redirect(`/auth/login?error=${code}`);
                }

                redirect("/auth/login?error=Default");
              }
            }}
            className="space-y-4"
          >
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
                autoComplete="email"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00ff87] transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-xs font-medium text-zinc-400"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-zinc-500 hover:text-[#00ff87] transition"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#00ff87] transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition mt-2"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            No account?{" "}
            <Link
              href="/auth/register"
              className="text-[#00ff87] hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}