import { auth, signOut } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The middleware (src/middleware.ts) already redirects unauthenticated users
  // to /auth/login before this layout runs — so we never need to redirect here.
  // Doing so would create a redirect loop with the login page.
  const session = await auth();

  // Resolve display info — fall back gracefully if id is missing
  const userId = session?.user?.id;
  let displayName = session?.user?.name ?? session?.user?.email ?? "Athlete";
  let email = session?.user?.email ?? "";
  let username = "";
  let isAdmin = false;

  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, username: true, is_admin: true },
      });
      if (user) {
        displayName = user.name ?? user.email ?? displayName;
        email = user.email;
        username = user.username ?? "";
        isAdmin = user.is_admin ?? false;
      }
    } catch {
      // Non-fatal — sidebar will still render with session data
    }
  }

  const initials = displayName.slice(0, 2).toUpperCase();

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/auth/login" });
  };

  return (
    <div className="sp-shell">
      <DashboardSidebar
        displayName={displayName}
        email={email}
        initials={initials}
        isAdmin={isAdmin}
        signOutAction={signOutAction}
      />
      <div className="sp-content">{children}</div>
    </div>
  );
}
