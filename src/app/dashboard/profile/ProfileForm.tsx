"use client";

import { useState, useTransition } from "react";
import { createOrUpdatePlayer, updateEmail, updatePassword } from "./actions";

type Player = {
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  gender: string;
} | null;

interface Props {
  existing: Player;
  userName: string | null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sp-card" style={{ padding: "24px", marginBottom: 16 }}>
      <p className="sp-section-title" style={{ marginBottom: 18 }}>{title}</p>
      {children}
    </div>
  );
}

// ── Player profile ─────────────────────────────────────────────────────────

function PlayerSection({ existing, userName }: { existing: Player; userName: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dobValue     = existing?.date_of_birth ? new Date(existing.date_of_birth).toISOString().split("T")[0] : "";
  const nameParts    = (userName ?? "").trim().split(" ");
  const defaultFirst = existing?.first_name ?? nameParts[0] ?? "";
  const defaultLast  = existing?.last_name  ?? nameParts.slice(1).join(" ") ?? "";

  function handleSubmit(fd: FormData) {
    setError(null); setSuccess(false);
    start(async () => {
      const res = await createOrUpdatePlayer(fd);
      if (!res.success) setError(res.message ?? "Something went wrong.");
      else setSuccess(true);
    });
  }

  return (
    <Section title="Player Profile">
      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error   && <div className="sp-notice sp-notice-err">{error}</div>}
        {success && <div className="sp-notice sp-notice-ok">Profile saved!</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="sp-label">First Name</label>
            <input name="first_name" required defaultValue={defaultFirst} placeholder="Alex" className="sp-input" />
          </div>
          <div>
            <label className="sp-label">Last Name</label>
            <input name="last_name" required defaultValue={defaultLast} placeholder="Johnson" className="sp-input" />
          </div>
        </div>
        <div>
          <label className="sp-label">Date of Birth</label>
          <input name="date_of_birth" type="date" required defaultValue={dobValue} className="sp-input" />
        </div>
        <div>
          <label className="sp-label">Gender</label>
          <select name="gender" required defaultValue={existing?.gender ?? ""} className="sp-input" style={{ appearance: "auto" }}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
        <button type="submit" disabled={pending} className="sp-btn-primary" style={{ marginTop: 4 }}>
          {pending ? "Saving…" : existing ? "Update Profile" : "Create Profile"}
        </button>
      </form>
    </Section>
  );
}

// ── Change email — requires current password to confirm ────────────────────

function EmailSection() {
  const [pending, start] = useTransition();
  const [newEmail,  setNewEmail]  = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(false);
    start(async () => {
      // updateEmail(newEmail, currentPassword) — both args required
      const res = await updateEmail(newEmail, password);
      if (!res.success) setError(res.message ?? "Something went wrong.");
      else { setSuccess(true); setNewEmail(""); setPassword(""); }
    });
  }

  return (
    <Section title="Change Email">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error   && <div className="sp-notice sp-notice-err">{error}</div>}
        {success && <div className="sp-notice sp-notice-ok">Email updated! Sign in again to use the new address.</div>}
        <div>
          <label className="sp-label">New Email Address</label>
          <input
            type="email" required value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@example.com" className="sp-input"
          />
        </div>
        <div>
          <label className="sp-label">Current Password (to confirm)</label>
          <input
            type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your current password" className="sp-input"
          />
        </div>
        <button type="submit" disabled={pending} className="sp-btn-secondary">
          {pending ? "Updating…" : "Update Email"}
        </button>
      </form>
    </Section>
  );
}

// ── Change password ────────────────────────────────────────────────────────

function PasswordSection() {
  const [pending, start] = useTransition();
  const [current, setCurrent]   = useState("");
  const [next,    setNext]      = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error,   setError]     = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(false);
    start(async () => {
      const res = await updatePassword(current, next, confirm);
      if (!res.success) setError(res.message ?? "Something went wrong.");
      else { setSuccess(true); setCurrent(""); setNext(""); setConfirm(""); }
    });
  }

  return (
    <Section title="Change Password">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error   && <div className="sp-notice sp-notice-err">{error}</div>}
        {success && <div className="sp-notice sp-notice-ok">Password updated successfully!</div>}
        <div>
          <label className="sp-label">Current Password</label>
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Your current password" className="sp-input" />
        </div>
        <div>
          <label className="sp-label">New Password</label>
          <input type="password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min. 8 characters" className="sp-input" />
        </div>
        <div>
          <label className="sp-label">Confirm New Password</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" className="sp-input" />
        </div>
        <button type="submit" disabled={pending} className="sp-btn-secondary">
          {pending ? "Updating…" : "Update Password"}
        </button>
      </form>
    </Section>
  );
}

export default function ProfileForm({ existing, userName }: Props) {
  return (
    <div>
      <PlayerSection existing={existing} userName={userName} />
      <EmailSection />
      <PasswordSection />
    </div>
  );
}