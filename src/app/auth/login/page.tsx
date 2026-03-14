import { auth, signIn } from "@/api/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthError } from "next-auth";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin:      "Invalid email or password.",
  OAuthAccountNotLinked:  "This email is already linked to another sign-in method.",
  OAuthSignin:            "Could not sign in with Google. Please try again.",
  OAuthCallback:          "OAuth callback error. Please try again.",
  Default:                "Something went wrong. Please try again.",
};

interface Props { searchParams?: Promise<{ error?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const params   = await (searchParams ?? Promise.resolve({ error: "" }));
  const errorKey = params.error ?? "";
  const errorMsg = errorKey ? (AUTH_ERROR_MESSAGES[errorKey] ?? AUTH_ERROR_MESSAGES.Default) : null;

  return (
    <div className="sp-auth-page">
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link href="/" style={{ display: "inline-block", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.05em", textDecoration: "none", color: "var(--text-primary)" }}>
            SPORTS<span style={{ color: "var(--accent)" }}>PORTAL</span>
          </Link>
          <p style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Manage your teams, events, and matches.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, padding: "32px", display: "flex", flexDirection: "column", gap: 20 }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Sign in</h1>

          {/* Error */}
          {errorMsg && (
            <div className="sp-notice sp-notice-err" style={{ fontSize: "0.875rem" }}>✕ {errorMsg}</div>
          )}

          {/* Google */}
          <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
            <button type="submit" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: "#fff", color: "#111", fontWeight: 600, fontSize: "0.9375rem", padding: "11px 20px", borderRadius: 12, border: "none", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Credentials */}
          <form
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
            action={async (formData: FormData) => {
              "use server";
              const email    = formData.get("email")    as string;
              const password = formData.get("password") as string;
              try {
                await signIn("credentials", { email, password, redirectTo: "/dashboard" });
              } catch (error) {
                if (error instanceof Error && (error as any).digest?.startsWith("NEXT_REDIRECT")) throw error;
                if (error instanceof AuthError) {
                  const code = error.type === "CredentialsSignin" ? "CredentialsSignin" : "Default";
                  redirect(`/auth/login?error=${code}`);
                }
                redirect("/auth/login?error=Default");
              }
            }}
          >
            <div>
              <label className="sp-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="sp-input" />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="sp-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                <Link href="/auth/forgot-password" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none" }}>Forgot password?</Link>
              </div>
              <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className="sp-input" />
            </div>
            <button type="submit" className="sp-btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.9375rem", marginTop: 4 }}>
              Sign In
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            No account?{" "}
            <Link href="/auth/register" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}