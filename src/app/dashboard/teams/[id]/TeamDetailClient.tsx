"use client";

import { useState, useTransition } from "react";
import { transferCaptaincy } from "./actions";
import { leaveTeam } from "../actions";

interface Props {
  teamId: string;
  isCaptain: boolean;
  isMember: boolean;
  members: { id: string; name: string }[];
}

export default function TeamDetailClient({
  teamId,
  isCaptain,
  isMember,
  members,
}: Props) {
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState(members[0]?.id ?? "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removed unused notice state

  const selectedName = members.find((m) => m.id === selected)?.name ?? "";

  function handleTransfer() {
    setError(null);
    start(async () => {
      const res = await transferCaptaincy(teamId, selected);
      if (!res.success) {
        setError(res.message ?? "Failed to transfer captaincy.");
        setShowConfirm(false);
      } else {
        setTransferSuccess(true);
        setShowConfirm(false);
      }
    });
  }

  function handleLeave() {
    setError(null);
    start(async () => {
      const res = await leaveTeam(teamId);
      if (!res.success) setError(res.message ?? "Failed to leave team.");
      else setLeaveSuccess(true);
    });
  }

  if (leaveSuccess) {
    return (
      <div className="sp-notice sp-notice-ok">
        You have left the team. Refresh to update the page.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <div className="sp-notice sp-notice-err">{error}</div>}
      {/* Removed unused notice display */}

      {/* Transfer captaincy — captain only */}
      {isCaptain && members.length > 0 && (
        <div>
          {transferSuccess ? (
            <div className="sp-notice sp-notice-ok">
              Captaincy transferred to {selectedName}. Refresh to see the
              change.
            </div>
          ) : (
            <>
              <p className="sp-section-title" style={{ marginBottom: 10 }}>
                Transfer Captaincy
              </p>
              {!showConfirm ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    className="sp-select"
                    style={{ flex: 1 }}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={!selected}
                    className="sp-btn-secondary"
                    style={{ fontSize: "0.8125rem", padding: "8px 14px" }}
                  >
                    Transfer
                  </button>
                </div>
              ) : (
                <div
                  className="sp-notice sp-notice-warn"
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <p style={{ fontSize: "0.875rem" }}>
                    Transfer captain role to <strong>{selectedName}</strong>?
                    You will lose captain privileges.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleTransfer}
                      disabled={pending}
                      className="sp-btn-primary"
                      style={{ fontSize: "0.8125rem", padding: "7px 16px" }}
                    >
                      {pending ? "Transferring…" : "Yes, Transfer"}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="sp-btn-ghost"
                      style={{ fontSize: "0.8125rem" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Leave team — non-captain members only */}
      {isMember && !isCaptain && (
        <div
          style={{
            paddingTop: isCaptain ? 16 : 0,
            borderTop: isCaptain ? "1px solid var(--border)" : "none",
          }}
        >
          <p className="sp-section-title" style={{ marginBottom: 10 }}>
            Leave Team
          </p>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              marginBottom: 12,
            }}
          >
            You will be removed from this team&rsquo;s roster.
          </p>
          <button
            disabled={pending}
            onClick={() => {
              if (!confirm("Are you sure you want to leave this team?")) return;
              handleLeave();
            }}
            className="sp-btn-danger"
          >
            {pending ? "Leaving…" : "Leave Team"}
          </button>
        </div>
      )}
    </div>
  );
}
