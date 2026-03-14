"use client";

import { useState, useTransition } from "react";
import { transferCaptaincy } from "./actions";

interface Props {
  teamId: string;
  members: { id: string; name: string }[];
}

export default function TeamDetailClient({ teamId, members }: Props) {
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState(members[0]?.id ?? "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedName = members.find((m) => m.id === selected)?.name ?? "";

  function handleTransfer() {
    setError(null);
    start(async () => {
      const res = await transferCaptaincy(teamId, selected);
      if (!res.success) {
        setError(res.message ?? "Failed to transfer captaincy.");
        setShowConfirm(false);
      } else {
        setSuccess(true);
        setShowConfirm(false);
      }
    });
  }

  if (success) {
    return (
      <p className="text-[#00ff87] text-xs bg-[#00ff87]/10 border border-[#00ff87]/20 px-3 py-2 rounded-lg">
        Captaincy transferred to {selectedName}. Refresh to see the change.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Transfer Captaincy</p>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
      )}

      {!showConfirm ? (
        <div className="flex gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#00ff87] transition"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!selected}
            className="text-xs font-semibold text-amber-400 border border-amber-400/20 px-3 py-2 rounded-lg hover:bg-amber-400/10 transition disabled:opacity-40"
          >
            Transfer
          </button>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 space-y-3">
          <p className="text-amber-300 text-xs">
            Transfer captain role to <strong>{selectedName}</strong>? You will lose captain privileges.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleTransfer}
              disabled={pending}
              className="text-xs font-bold bg-amber-400 text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-amber-300 transition disabled:opacity-40"
            >
              {pending ? "Transferring…" : "Yes, Transfer"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-xs font-semibold text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-white/5 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}