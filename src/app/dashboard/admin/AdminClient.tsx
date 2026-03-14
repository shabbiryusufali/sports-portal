"use client";

import { useState, useTransition } from "react";
import { addSport, deleteSport, updateSport } from "./actions";

type Sport = {
  id: string;
  name: string;
  description: string | null;
  is_team_sport: boolean;
  _count: { teams: number; events: number };
};

export default function AdminClient({ sports: initialSports }: { sports: Sport[] }) {
  const [pending, start] = useTransition();
  const [sports, setSports] = useState(initialSports);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function flash(type: "ok" | "err", msg: string) {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3500);
  }

  function handleAdd(fd: FormData) {
    start(async () => {
      const res = await addSport(fd);
      if (res.success) { flash("ok", "Sport added! Reload to see it."); setShowAdd(false); }
      else flash("err", res.message ?? "Failed to add sport");
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    start(async () => {
      const res = await deleteSport(id);
      if (res.success) { setSports((p) => p.filter((s) => s.id !== id)); flash("ok", `"${name}" deleted.`); }
      else flash("err", res.message ?? "Failed to delete");
    });
  }

  function handleUpdate(id: string, fd: FormData) {
    start(async () => {
      const res = await updateSport(id, fd);
      if (res.success) { setEditId(null); flash("ok", "Sport updated!"); }
      else flash("err", res.message ?? "Failed to update");
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {notice && (
        <div className={`sp-notice ${notice.type === "ok" ? "sp-notice-ok" : "sp-notice-err"}`}>{notice.msg}</div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 18, background: "var(--accent)", borderRadius: 3, display: "inline-block" }} />
          Sports
        </h2>
        <button onClick={() => setShowAdd((v) => !v)} className="sp-btn-primary" style={{ padding: "8px 18px" }}>
          {showAdd ? "Cancel" : "+ Add Sport"}
        </button>
      </div>

      {showAdd && (
        <form action={handleAdd} className="sp-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <p className="sp-section-title">New Sport</p>
          <div>
            <label className="sp-label">Name</label>
            <input name="name" required placeholder="e.g. Basketball" className="sp-input" />
          </div>
          <div>
            <label className="sp-label">Description</label>
            <input name="description" placeholder="Optional" className="sp-input" />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input name="is_team_sport" type="checkbox" value="true" style={{ width: 16, height: 16, accentColor: "var(--accent)" }} />
            Team sport
          </label>
          <button type="submit" disabled={pending} className="sp-btn-primary" style={{ alignSelf: "flex-start" }}>
            {pending ? "Adding…" : "Add Sport"}
          </button>
        </form>
      )}

      <div className="sp-card" style={{ overflow: "hidden" }}>
        {sports.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "2rem", marginBottom: 10 }}>🏅</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>No sports yet. Add one above.</p>
          </div>
        ) : sports.map((sport, i) => (
          <div key={sport.id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined, padding: "16px 24px" }}>
            {editId === sport.id ? (
              <form action={(fd) => handleUpdate(sport.id, fd)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="sp-label">Name</label>
                    <input name="name" required defaultValue={sport.name} className="sp-input" />
                  </div>
                  <div>
                    <label className="sp-label">Description</label>
                    <input name="description" defaultValue={sport.description ?? ""} className="sp-input" />
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input name="is_team_sport" type="checkbox" value="true" defaultChecked={sport.is_team_sport} style={{ width: 16, height: 16, accentColor: "var(--accent)" }} />
                  Team sport
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={pending} className="sp-btn-primary" style={{ padding: "8px 18px" }}>{pending ? "Saving…" : "Save"}</button>
                  <button type="button" onClick={() => setEditId(null)} className="sp-btn-ghost" style={{ padding: "8px 16px" }}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{sport.name}</p>
                    <span className={`badge ${sport.is_team_sport ? "badge-blue" : "badge-purple"}`}>
                      {sport.is_team_sport ? "Team" : "Individual"}
                    </span>
                  </div>
                  {sport.description && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 3 }}>{sport.description}</p>}
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                    {sport._count.teams} team{sport._count.teams !== 1 ? "s" : ""} · {sport._count.events} event{sport._count.events !== 1 ? "s" : ""}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setEditId(sport.id)} className="sp-btn-secondary" style={{ padding: "7px 14px", fontSize: "0.8125rem" }}>Edit</button>
                  <button disabled={pending} onClick={() => handleDelete(sport.id, sport.name)} className="sp-btn-danger" style={{ padding: "7px 14px", fontSize: "0.8125rem" }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}