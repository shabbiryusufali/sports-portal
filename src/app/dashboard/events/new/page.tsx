import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import NewEventClient from "./NewEventClient";

export default async function NewEventPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [sports, player] = await Promise.all([
    prisma.sport.findMany({ orderBy: { name: "asc" } }),
    userId
      ? prisma.player.findUnique({
          where: { id: userId },
          include: { captainOf: { include: { sport: true } } },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div style={{ padding: "32px 32px 40px", maxWidth: 720, width: "100%" }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 28,
          fontSize: "0.8125rem",
        }}
      >
        <Link
          href="/dashboard/events"
          style={{
            color: "var(--text-muted)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Events
        </Link>
        <span style={{ color: "var(--text-muted)" }}>›</span>
        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
          New Event
        </span>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h1 className="sp-page-title">Create Event</h1>
        <p className="sp-page-subtitle">
          Schedule a practice, game, or tournament. Teams are optional.
        </p>
      </div>

      <NewEventClient
        sports={sports}
        captainOfTeams={player?.captainOf ?? []}
      />
    </div>
  );
}
