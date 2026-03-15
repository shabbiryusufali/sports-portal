"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/app/dashboard/actions";

type Sport = { id: string; name: string; description: string | null };
type Team = { id: string; name: string; sport: Sport };

interface Props {
  sports: Sport[];
  captainOfTeams: Team[];
}

export default function NewEventClient({ sports, captainOfTeams }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>("");

  const teamsForSport = captainOfTeams.filter(
    (t) => t.sport.id === selectedSport,
  );

  function handleSubmit(fd: FormData) {
    setError(null);
    start(async () => {
      const res = await createEvent(fd);
      if (!res.success) setError(res.message ?? "Failed to create event.");
      else router.push(`/dashboard/events/${res.id}`);
    });
  }

  return (
    <form
      action={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {error && <div className="sp-notice sp-notice-err">{error}</div>}

      {/* Event details */}
      <div
        className="sp-card"
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <p className="sp-section-title">Event Details</p>

        <div>
          <label className="sp-label">Event Name</label>
          <input
            name="name"
            required
            placeholder="e.g. Friday Night Tournament"
            className="sp-input"
          />
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <div>
            <label className="sp-label">Sport</label>
            {sports.length === 0 ? (
              <p
                style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}
              >
                No sports available yet.
              </p>
            ) : (
              <select
                name="sport_id"
                required
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="sp-input"
                style={{ appearance: "auto" }}
              >
                <option value="">Select…</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="sp-label">Event Type</label>
            <select
              name="event_type"
              required
              className="sp-input"
              style={{ appearance: "auto" }}
            >
              <option value="PRACTICE">Practice</option>
              <option value="GAME">Game</option>
              <option value="TOURNAMENT">Tournament</option>
            </select>
          </div>
        </div>

        <div>
          <label className="sp-label">
            Description{" "}
            <span
              style={{
                color: "var(--text-muted)",
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              (optional)
            </span>
          </label>
          <textarea
            name="description"
            placeholder="Add details about this event…"
            rows={3}
            className="sp-input"
            style={{ resize: "vertical", minHeight: 80 }}
          />
        </div>
      </div>

      {/* Schedule & location */}
      <div
        className="sp-card"
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <p className="sp-section-title">Schedule & Location</p>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <div>
            <label className="sp-label">Start Time</label>
            <input
              name="start_time"
              type="datetime-local"
              required
              className="sp-input"
            />
          </div>
          <div>
            <label className="sp-label">End Time</label>
            <input
              name="end_time"
              type="datetime-local"
              required
              className="sp-input"
            />
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <div>
            <label className="sp-label">
              Location{" "}
              <span
                style={{
                  color: "var(--text-muted)",
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (optional)
              </span>
            </label>
            <input
              name="location"
              placeholder="e.g. Sports Centre, Field 3"
              className="sp-input"
            />
          </div>
          <div>
            <label className="sp-label">
              Registration Deadline{" "}
              <span
                style={{
                  color: "var(--text-muted)",
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (optional)
              </span>
            </label>
            <input
              name="registration_deadline"
              type="datetime-local"
              className="sp-input"
            />
          </div>
        </div>
      </div>

      {/* Teams */}
      {captainOfTeams.length > 0 && (
        <div
          className="sp-card"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <p className="sp-section-title">
            Your Team{" "}
            <span
              style={{
                color: "var(--text-muted)",
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              (optional)
            </span>
          </p>
          {selectedSport && teamsForSport.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              None of your teams play this sport.
            </p>
          ) : (
            <div>
              <label className="sp-label">Add your team to this event</label>
              <select
                name="team_id"
                className="sp-input"
                style={{ appearance: "auto" }}
              >
                <option value="">None</option>
                {(selectedSport ? teamsForSport : captainOfTeams).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Visibility */}
      <div className="sp-card" style={{ padding: "20px 24px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
        >
          <input
            name="is_public"
            type="checkbox"
            value="true"
            style={{ width: 18, height: 18, accentColor: "var(--accent)" }}
          />
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              Make event public
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                marginTop: 2,
              }}
            >
              Public events are visible to all users.
            </p>
          </div>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="sp-btn-primary"
        style={{
          alignSelf: "flex-start",
          padding: "12px 28px",
          fontSize: "0.9375rem",
        }}
      >
        {pending ? "Creating…" : "Create Event"}
      </button>
    </form>
  );
}
