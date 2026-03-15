"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ── SVG Icons ──────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg className="icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const UsersIcon = () => (
  <svg className="icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.916-3.519M17 20H7m10 0v-2c0-.653-.12-1.276-.34-1.85M7 20H2v-2a4 4 0 015.916-3.519M7 20v-2c0-.653.12-1.276.34-1.85m0 0A5.97 5.97 0 0112 15c1.306 0 2.516.418 3.5 1.13M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const TrophyIcon = () => (
  <svg className="icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
const UserIcon = () => (
  <svg className="icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const SettingsIcon = () => (
  <svg className="icon" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const MenuIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const CloseIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SignOutIcon = () => (
  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// ── Nav item definitions ───────────────────────────────────────────────────
const mainNav = [
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon },
  { href: "/dashboard/events", label: "Events", Icon: CalendarIcon },
  { href: "/dashboard/teams", label: "Teams", Icon: UsersIcon },
  { href: "/dashboard/leaderboards", label: "Leaderboards", Icon: TrophyIcon },
  { href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
];

const MOBILE_BREAKPOINT = 768;

type Props = {
  displayName: string;
  email: string;
  initials: string;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
};

export default function DashboardSidebar({
  displayName,
  email,
  initials,
  isAdmin,
  signOutAction,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // null = not yet measured (SSR), true/false = measured on client
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  // Detect mobile on mount and on resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  // Before JS hydrates, fall back to CSS classes so there's no layout flash
  if (isMobile === null) {
    return (
      <>
        <header className="sp-topbar">
          <Link href="/dashboard" style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.04em", textDecoration: "none", color: "var(--text-primary)" }}>
            SPORTS<span style={{ color: "var(--accent)" }}>PORTAL</span>
          </Link>
          <button aria-label="Toggle menu" style={{ color: "var(--text-secondary)", padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}>
            <MenuIcon />
          </button>
        </header>
        <aside className="sp-sidebar">
          <SidebarContents displayName={displayName} email={email} initials={initials} isAdmin={isAdmin} isActive={isActive} signOutAction={signOutAction} />
        </aside>
        <nav className="sp-bottomnav">
          <BottomNavLinks isActive={isActive} />
        </nav>
      </>
    );
  }

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Top bar */}
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 60,
          background: "var(--bg-surface)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", zIndex: 40,
        }}>
          <Link href="/dashboard" style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.04em", textDecoration: "none", color: "var(--text-primary)" }}>
            SPORTS<span style={{ color: "var(--accent)" }}>PORTAL</span>
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{ color: "var(--text-secondary)", padding: 6, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </header>

        {/* Overlay */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)", zIndex: 45,
            }}
          />
        )}

        {/* Slide-in sidebar drawer */}
        <aside style={{
          position: "fixed", top: 0, left: 0, width: 256, height: "100dvh",
          background: "var(--bg-surface)", borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column", zIndex: 50,
          overflowY: "auto", overflowX: "hidden",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: open ? "4px 0 40px rgba(0,0,0,0.6)" : "none",
        }}>
          <SidebarContents displayName={displayName} email={email} initials={initials} isAdmin={isAdmin} isActive={isActive} signOutAction={signOutAction} />
        </aside>

        {/* Bottom nav */}
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: 72,
          background: "var(--bg-surface)", borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-around",
          paddingBottom: "env(safe-area-inset-bottom, 0px)", zIndex: 40,
        }}>
          <BottomNavLinks isActive={isActive} />
        </nav>
      </>
    );
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <aside className="sp-sidebar">
      <SidebarContents displayName={displayName} email={email} initials={initials} isAdmin={isAdmin} isActive={isActive} signOutAction={signOutAction} />
    </aside>
  );
}

// ── Shared sidebar body ────────────────────────────────────────────────────
function SidebarContents({
  displayName, email, initials, isAdmin, isActive, signOutAction,
}: {
  displayName: string;
  email: string;
  initials: string;
  isAdmin: boolean;
  isActive: (href: string) => boolean;
  signOutAction: () => Promise<void>;
}) {
  return (
    <>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/dashboard" style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.045em", textDecoration: "none", color: "var(--text-primary)", display: "block" }}>
          SPORTS<span style={{ color: "var(--accent)" }}>PORTAL</span>
        </Link>
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4, fontWeight: 500 }}>
          Sports Management Platform
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        <p className="sp-section-title" style={{ padding: "4px 8px 8px" }}>Navigation</p>

        {mainNav.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={`sp-nav-item ${isActive(href) ? "active" : ""}`}>
            <Icon />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }} />
            <p className="sp-section-title" style={{ padding: "4px 8px 8px" }}>Admin</p>
            <Link
              href="/dashboard/admin"
              className={`sp-nav-item ${isActive("/dashboard/admin") ? "active" : ""}`}
              style={{ color: isActive("/dashboard/admin") ? "#fbbf24" : undefined }}
            >
              <SettingsIcon />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", marginBottom: 8 }}>
          <div className="sp-avatar" style={{ width: 34, height: 34, fontSize: "0.7rem" }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </p>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </p>
          </div>
        </div>
        <form action={signOutAction} style={{ width: "100%" }}>
          <button type="submit" className="sp-btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: "0.8125rem" }}>
            <SignOutIcon />
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

// ── Bottom nav tab links ───────────────────────────────────────────────────
function BottomNavLinks({ isActive }: { isActive: (href: string) => boolean }) {
  return (
    <>
      {mainNav.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className={`sp-tab ${isActive(href) ? "active" : ""}`}>
          <Icon />
          {label}
        </Link>
      ))}
    </>
  );
}