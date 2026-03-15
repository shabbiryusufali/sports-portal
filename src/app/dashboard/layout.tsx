import { auth, signOut } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const userId = session?.user?.id;
  let displayName = session?.user?.name ?? session?.user?.email ?? "Athlete";
  let email = session?.user?.email ?? "";
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
        isAdmin = user.is_admin ?? false;
      }
    } catch {
      // Non-fatal
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
      {/*
        sp-content applies:
          desktop → margin-left: 256px
          mobile  → margin-left: 0, padding-top: 60px, padding-bottom: 72px
        via globals.css @media (max-width: 767px)
      */}
      <div className="sp-content">{children}</div>
    </div>
  );
}