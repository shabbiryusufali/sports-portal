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

  
interface Props {
  sports: {
    id: string;
    name: string;
    description: string | null;
    is_team_sport: boolean;
    _count: { teams: number; events: number };
  }[];
}

  function handleAdd(fd: FormData) {
    start(async () => {
      const res = await addSport(fd);
      if (res.success) {
        flash("ok", "Sport added! Refresh to see it.");
        setShowAdd(false);
      } else {
        flash("err", res.message ?? "Failed to add sport");
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete sport "${name}"? This cannot be undone.`)) return;
    start(async () => {
      const res = await deleteSport(id);
      if (res.success) {
        setSports((prev) => prev.filter((s) => s.id !== id));
        flash("ok", `"${name}" deleted.`);
      } else {
        flash("err", res.message ?? "Failed to delete sport");
      }
    });
  }

  function handleUpdate(id: string, fd: FormData) {
    start(async () => {
      const res = await updateSport(id, fd);
      if (res.success) {
        setEditId(null);
        flash("ok", "Sport updated! Refresh to see changes.");
      } else {
        flash("err", res.message ?? "Failed to update");
      }
    });
  }

  return (
    <div>
      {notice && (
        <div
          className={`mb-5 text-sm px-4 py-3 rounded-lg border ${
            notice.type === "ok"
              ? "bg-green-900/30 border-green-700 text-green-400"
              : "bg-red-900/30 border-red-700 text-red-400"
          }`}
        >
          {notice.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff87] inline-block" />
          Sports
        </h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="bg-[#00ff87] text-zinc-900 font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#00e87a] transition"
        >
          {showAdd ? "Cancel" : "+ Add Sport"}
        </button>
      </div>

      {/* Add Sport Form */}
      {showAdd && (
        <form
          action={handleAdd}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6 space-y-4"
        >
          <h3 className="font-semibold text-sm text-zinc-300">New Sport</h3>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Name *</label>
            <input
              name="name"
              required
              placeholder="e.g. Basketball"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Description</label>
            <input
              name="description"
              placeholder="Optional description"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Type</label>
            <select
              name="is_team_sport"
              defaultValue="true"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
            >
              <option value="true">Team sport</option>
              <option value="false">Individual sport</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#00ff87] text-zinc-900 font-bold py-2.5 rounded-xl text-sm hover:bg-[#00e87a] transition disabled:opacity-50"
          >
            {pending ? "Adding…" : "Add Sport"}
          </button>
        </form>
      )}

      {/* Sports List */}
      {sports.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-zinc-500 text-sm">No sports yet. Add one above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sports.map((sport) =>
            editId === sport.id ? (
              <form
                key={sport.id}
                action={(fd) => handleUpdate(sport.id, fd)}
                className="bg-zinc-900 border border-[#00ff87]/30 rounded-2xl p-5 space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Name</label>
                    <input
                      name="name"
                      required
                      defaultValue={sport.name}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Type</label>
                    <select
                      name="is_team_sport"
                      defaultValue={String(sport.is_team_sport)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
                    >
                      <option value="true">Team sport</option>
                      <option value="false">Individual</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Description</label>
                  <input
                    name="description"
                    defaultValue={sport.description ?? ""}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00ff87]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 bg-[#00ff87] text-zinc-900 font-bold py-2 rounded-xl text-sm hover:bg-[#00e87a] transition disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="px-4 py-2 border border-zinc-700 text-zinc-400 rounded-xl text-sm hover:border-zinc-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={sport.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-[#00ff87] font-black text-sm shrink-0">
                  {sport.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm">{sport.name}</p>
                    <span className="text-xs text-zinc-600 border border-zinc-700 px-1.5 py-0.5 rounded">
                      {sport.is_team_sport ? "Team" : "Individual"}
                    </span>
                  </div>
                  {sport.description && (
                    <p className="text-zinc-500 text-xs truncate">{sport.description}</p>
                  )}
                  <p className="text-zinc-600 text-xs mt-1">
                    {sport._count.teams} teams · {sport._count.events} events
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditId(sport.id)}
                    className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-lg hover:border-zinc-500 transition"
                  >
                    Edit
                  </button>
                  <button
                    disabled={pending || sport._count.teams > 0 || sport._count.events > 0}
                    onClick={() => handleDelete(sport.id, sport.name)}
                    className="text-xs text-zinc-600 hover:text-red-400 border border-zinc-800 hover:border-red-700/50 px-3 py-1.5 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title={
                      sport._count.teams > 0 || sport._count.events > 0
                        ? "Cannot delete: has associated teams or events"
                        : "Delete sport"
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}