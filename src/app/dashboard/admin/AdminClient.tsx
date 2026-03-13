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

interface Props {
  sports: Sport[];
}

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#00ff87]/50 focus:bg-white/[0.06] transition";

const labelClass = "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2";

export default function AdminClient({ sports: initialSports }: Props) {
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
      if (res.success) {
        flash("ok", "Sport added! Reload to see it.");
        setShowAdd(false);
      } else {
        flash("err", res.message ?? "Failed to add sport");
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    start(async () => {
      const res = await deleteSport(id);
      if (res.success) {
        setSports((prev) => prev.filter((s) => s.id !== id));
        flash("ok", `"${name}" deleted.`);
      } else {
        flash("err", res.message ?? "Failed to delete");
      }
    });
  }

  function handleUpdate(id: string, fd: FormData) {
    start(async () => {
      const res = await updateSport(id, fd);
      if (res.success) {
        setEditId(null);
        flash("ok", "Sport updated! Reload to see changes.");
      } else {
        flash("err", res.message ?? "Failed to update");
      }
    });
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${
          notice.type === "ok"
            ? "bg-[#00ff87]/10 border-[#00ff87]/20 text-[#00ff87]"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {notice.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <span className="w-1.5 h-4 bg-[#00ff87] rounded-full inline-block" />
          Sports
        </h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="bg-[#00ff87] text-zinc-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#00e87a] transition"
        >
          {showAdd ? "Cancel" : "+ Add Sport"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form action={handleAdd} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5">
          <p className="text-sm font-bold text-zinc-300 uppercase tracking-widest">New Sport</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input name="name" required placeholder="e.g. Basketball" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select name="is_team_sport" defaultValue="true" className={inputClass}>
                <option value="true">Team sport</option>
                <option value="false">Individual sport</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <input name="description" placeholder="Optional description" className={inputClass} />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#00ff87] text-zinc-900 font-bold py-3 rounded-xl text-sm hover:bg-[#00e87a] transition disabled:opacity-40"
          >
            {pending ? "Adding…" : "Add Sport"}
          </button>
        </form>
      )}

      {/* Sports list */}
      {sports.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-6 py-12 text-center">
          <p className="text-4xl mb-3">🏅</p>
          <p className="text-zinc-500 text-sm">No sports yet. Add one above!</p>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {sports.map((sport) =>
              editId === sport.id ? (
                <form
                  key={sport.id}
                  action={(fd) => handleUpdate(sport.id, fd)}
                  className="p-6 space-y-4 bg-white/[0.02]"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input name="name" required defaultValue={sport.name} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <select name="is_team_sport" defaultValue={String(sport.is_team_sport)} className={inputClass}>
                        <option value="true">Team sport</option>
                        <option value="false">Individual</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <input name="description" defaultValue={sport.description ?? ""} className={inputClass} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={pending} className="flex-1 bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl text-sm hover:bg-[#00e87a] transition disabled:opacity-40">
                      Save Changes
                    </button>
                    <button type="button" onClick={() => setEditId(null)} className="px-5 py-2.5 border border-white/10 text-zinc-400 rounded-xl text-sm hover:border-white/20 transition">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div key={sport.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00ff87]/10 flex items-center justify-center font-black text-xs text-[#00ff87] shrink-0">
                    {sport.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm">{sport.name}</p>
                      <span className="text-xs text-zinc-600 border border-white/[0.06] px-2 py-0.5 rounded-full">
                        {sport.is_team_sport ? "Team" : "Individual"}
                      </span>
                    </div>
                    {sport.description && (
                      <p className="text-zinc-500 text-xs truncate">{sport.description}</p>
                    )}
                    <p className="text-zinc-700 text-xs mt-0.5">
                      {sport._count.teams} teams · {sport._count.events} events
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditId(sport.id)}
                      className="text-xs text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/20 px-3 py-1.5 rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      disabled={pending || sport._count.teams > 0 || sport._count.events > 0}
                      onClick={() => handleDelete(sport.id, sport.name)}
                      title={sport._count.teams > 0 || sport._count.events > 0 ? "Has associated teams or events" : "Delete"}
                      className="text-xs text-zinc-600 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 px-3 py-1.5 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}