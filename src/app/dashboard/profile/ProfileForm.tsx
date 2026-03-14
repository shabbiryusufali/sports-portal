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

const input = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00ff87] transition";
const label = "block text-xs font-medium text-zinc-400 mb-1.5";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-4">
      <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

// ── Player profile section ────────────────────────────────────────────────────

function PlayerSection({ existing, userName }: { existing: Player; userName: string | null }) {
  const [pending, start] = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // FIX: display in UTC so timezone can't shift the date
  const dobValue = existing?.date_of_birth
    ? new Date(existing.date_of_birth).toISOString().split("T")[0]
    : "";

  // Auto-fill first/last name from user.name if no player profile yet
  const nameParts = (userName ?? "").trim().split(" ");
  const defaultFirst = existing?.first_name ?? nameParts[0] ?? "";
  const defaultLast  = existing?.last_name  ?? nameParts.slice(1).join(" ") ?? "";

  function handleSubmit(fd: FormData) {
    setError(null);
    setSuccess(false);
    start(async () => {
      const res = await createOrUpdatePlayer(fd);
      if (!res.success) setError(res.message ?? "Something went wrong.");
      else setSuccess(true);
    });
  }

  return (
    <Section title="Player Profile">
      <form action={handleSubmit} className="space-y-4">
        {error   && <p className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</p>}
        {success && <p className="bg-green-900/30 border border-green-700 text-green-400 text-sm px-4 py-3 rounded-lg">Profile saved!</p>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>First Name</label>
            <input name="first_name" required defaultValue={defaultFirst} placeholder="Alex" className={input} />
          </div>
          <div>
            <label className={label}>Last Name</label>
            <input name="last_name" required defaultValue={defaultLast} placeholder="Johnson" className={input} />
          </div>
        </div>

        <div>
          <label className={label}>Date of Birth</label>
          <input name="date_of_birth" type="date" required defaultValue={dobValue} className={input} />
        </div>

        <div>
          <label className={label}>Gender</label>
          <select name="gender" required defaultValue={existing?.gender ?? ""} className={input}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl hover:bg-[#00e87a] transition disabled:opacity-50 text-sm"
        >
          {pending ? "Saving…" : existing ? "Update Profile" : "Save Profile"}
        </button>
      </form>
    </Section>
  );
}

// ── Change email section ──────────────────────────────────────────────────────

function EmailSection() {
  const [pending, start] = useTransition();
  const [newEmail, setNewEmail]   = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    start(async () => {
      const res = await updateEmail(newEmail, password);
      if (!res.success) setError(res.message ?? "Something went wrong.");
      else { setSuccess(true); setNewEmail(""); setPassword(""); }
    });
  }

  return (
    <Section title="Change Email">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error   && <p className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</p>}
        {success && <p className="bg-green-900/30 border border-green-700 text-green-400 text-sm px-4 py-3 rounded-lg">Email updated! Sign in again to use the new address.</p>}

        <div>
          <label className={label}>New Email Address</label>
          <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@example.com" className={input} />
        </div>
        <div>
          <label className={label}>Current Password (to confirm)</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your current password" className={input} />
        </div>
        <button type="submit" disabled={pending} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50 text-sm">
          {pending ? "Updating…" : "Update Email"}
        </button>
      </form>
    </Section>
  );
}

// ── Change password section ───────────────────────────────────────────────────

function PasswordSection() {
  const [pending, start] = useTransition();
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    start(async () => {
      const res = await updatePassword(current, next, confirm);
      if (!res.success) setError(res.message ?? "Something went wrong.");
      else { setSuccess(true); setCurrent(""); setNext(""); setConfirm(""); }
    });
  }

  return (
    <Section title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error   && <p className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</p>}
        {success && <p className="bg-green-900/30 border border-green-700 text-green-400 text-sm px-4 py-3 rounded-lg">Password updated successfully!</p>}

        <div>
          <label className={label}>Current Password</label>
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Your current password" className={input} />
        </div>
        <div>
          <label className={label}>New Password</label>
          <input type="password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min. 8 characters" className={input} />
        </div>
        <div>
          <label className={label}>Confirm New Password</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" className={input} />
        </div>
        <button type="submit" disabled={pending} className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50 text-sm">
          {pending ? "Updating…" : "Update Password"}
        </button>
      </form>
    </Section>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function ProfileForm({ existing, userName }: Props) {
  return (
    <div className="space-y-6">
      <PlayerSection existing={existing} userName={userName} />
      <EmailSection />
      <PasswordSection />
    </div>
  );
}