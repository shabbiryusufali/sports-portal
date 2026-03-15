"use server";

// src/app/dashboard/tournaments/actions.ts
// Follows the same server-action pattern as the rest of the app.
// Uses @/lib/db (not @/lib/prisma), returns { success, message? }, uses auth().

import { auth } from "@/api/auth/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

async function requireAdmin() {
  const userId = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { is_admin: true },
  });
  if (!user?.is_admin) throw new Error("Admin access required");
  return userId;
}

// ─── Point system ─────────────────────────────────────────────────────────────
//  NORMAL       → winner 3pts, loser 0pts
//  TIEBREAK     → winner 2pts, loser 1pt  (e.g. game 3 in best-of-3)
//  FORFEIT      → winner 3pts, forfeiter 0pts
//  DOUBLE_FORFEIT → both 0pts

type ResultType = "NORMAL" | "TIEBREAK" | "FORFEIT" | "DOUBLE_FORFEIT";
type WinnerSide = "p1" | "p2" | null;

function calcPoints(
  type: ResultType,
  winner: WinnerSide,
): { p1: number; p2: number } {
  switch (type) {
    case "NORMAL":
      return winner === "p1"
        ? { p1: 3, p2: 0 }
        : winner === "p2"
          ? { p1: 0, p2: 3 }
          : { p1: 0, p2: 0 };
    case "TIEBREAK":
      return winner === "p1"
        ? { p1: 2, p2: 1 }
        : winner === "p2"
          ? { p1: 1, p2: 2 }
          : { p1: 0, p2: 0 };
    case "FORFEIT":
      return winner === "p1"
        ? { p1: 3, p2: 0 }
        : winner === "p2"
          ? { p1: 0, p2: 3 }
          : { p1: 0, p2: 0 };
    case "DOUBLE_FORFEIT":
      return { p1: 0, p2: 0 };
  }
}

type GameScore = { p1: number; p2: number };

function inferFromGames(
  games: GameScore[],
  bestOf: number,
): { type: "NORMAL" | "TIEBREAK"; winner: "p1" | "p2" } | null {
  const need = Math.ceil(bestOf / 2);
  let w1 = 0,
    w2 = 0;
  for (const g of games) {
    if (g.p1 > g.p2) w1++;
    else if (g.p2 > g.p1) w2++;
  }
  if (w1 >= need)
    return {
      type: games.length === bestOf ? "TIEBREAK" : "NORMAL",
      winner: "p1",
    };
  if (w2 >= need)
    return {
      type: games.length === bestOf ? "TIEBREAK" : "NORMAL",
      winner: "p2",
    };
  return null;
}

// ─── Tournaments ──────────────────────────────────────────────────────────────

export async function getTournaments() {
  await requireAuth();
  return prisma.tournament.findMany({
    include: {
      stages: { orderBy: { order: "asc" } },
      _count: { select: { participants: true } },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function getTournament(id: string) {
  await requireAuth();
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          groups: {
            include: {
              participants: { include: { participant: true } },
              matches: {
                include: { participant1: true, participant2: true },
                orderBy: [{ round: "asc" }, { match_number: "asc" }],
              },
            },
          },
          matches: {
            include: { participant1: true, participant2: true },
            orderBy: [{ round: "asc" }, { match_number: "asc" }],
          },
        },
      },
      participants: { orderBy: { name: "asc" } },
    },
  });
}

export async function createTournament(data: {
  name: string;
  description?: string;
  stages: { name: string; type: "GROUP" | "KNOCKOUT"; best_of?: number }[];
}): Promise<{ success: boolean; message?: string; id?: string }> {
  try {
    await requireAdmin();
    if (!data.name?.trim())
      return { success: false, message: "Name is required." };

    const tournament = await prisma.tournament.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        stages: {
          create: data.stages.map((s, i) => ({
            name: s.name,
            type: s.type,
            order: i + 1,
            best_of: s.best_of ?? 1,
          })),
        },
      },
    });

    revalidatePath("/dashboard/tournaments");
    return { success: true, id: tournament.id };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ─── Participants ─────────────────────────────────────────────────────────────

export async function addParticipants(
  tournamentId: string,
  participants: { name: string; seed?: number }[],
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    await prisma.$transaction(
      participants.map((p) =>
        prisma.tournamentParticipant.create({
          data: { tournament_id: tournamentId, name: p.name, seed: p.seed },
        }),
      ),
    );
    revalidatePath(`/dashboard/tournaments/${tournamentId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export async function createGroups(
  stageId: string,
  groups: { name: string; participantIds: string[] }[],
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();

    const stage = await prisma.tournamentStage.findUniqueOrThrow({
      where: { id: stageId },
    });

    await prisma.$transaction(
      groups.map((g, i) =>
        prisma.tournamentGroup.create({
          data: {
            stage_id: stageId,
            name: g.name,
            order: i,
            participants: {
              create: g.participantIds.map((pid) => ({ participant_id: pid })),
            },
          },
        }),
      ),
    );

    revalidatePath(`/dashboard/tournaments`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ─── Generate round-robin matches ─────────────────────────────────────────────
// Circle algorithm — each round is balanced, no participant plays twice per round.

export async function generateGroupMatches(
  stageId: string,
): Promise<{ success: boolean; message?: string; matchCount?: number }> {
  try {
    await requireAdmin();

    const stage = await prisma.tournamentStage.findUniqueOrThrow({
      where: { id: stageId },
      include: {
        groups: {
          include: { participants: true, matches: true },
        },
      },
    });

    if (stage.type !== "GROUP")
      return { success: false, message: "Stage is not a GROUP stage." };

    let totalCreated = 0;

    for (const group of stage.groups) {
      if (group.matches.length > 0) continue; // skip if already generated

      const ids = group.participants.map((gp) => gp.participant_id);
      if (ids.length < 2) continue;

      const rotating = [...ids];
      if (ids.length % 2 !== 0) rotating.push("BYE");
      const fixed = rotating.shift()!;
      const totalRounds = rotating.length;
      const perRound = (rotating.length + 1) / 2;

      const fixtures: { p1: string; p2: string; round: number; num: number }[] =
        [];
      const rot = [...rotating];

      for (let r = 0; r < totalRounds; r++) {
        const roundIds = [fixed, ...rot];
        let num = 1;
        for (let i = 0; i < perRound; i++) {
          const p1 = roundIds[i];
          const p2 = roundIds[roundIds.length - 1 - i];
          if (p1 !== "BYE" && p2 !== "BYE") {
            fixtures.push({ p1, p2, round: r + 1, num: num++ });
          }
        }
        rot.unshift(rot.pop()!);
      }

      await prisma.$transaction(
        fixtures.map((f) =>
          prisma.tournamentMatch.create({
            data: {
              stage_id: stageId,
              group_id: group.id,
              participant1_id: f.p1,
              participant2_id: f.p2,
              round: f.round,
              match_number: f.num,
              label: `${group.name} – R${f.round}M${f.num}`,
              status: "SCHEDULED",
            },
          }),
        ),
      );

      totalCreated += fixtures.length;
    }

    await prisma.tournamentStage.update({
      where: { id: stageId },
      data: { status: "ACTIVE" },
    });

    revalidatePath(`/dashboard/tournaments`);
    return { success: true, matchCount: totalCreated };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ─── Record a match result ────────────────────────────────────────────────────

export async function recordMatchResult(input: {
  matchId: string;
  resultType: ResultType;
  winnerId?: string | null; // actual participant ID
  forfeiterId?: string | null; // for FORFEIT type
  games?: GameScore[];
  notes?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();

    const match = await prisma.tournamentMatch.findUniqueOrThrow({
      where: { id: input.matchId },
      include: { stage: true },
    });

    if (!match.participant1_id || !match.participant2_id) {
      return {
        success: false,
        message: "Match does not have two participants assigned.",
      };
    }

    const p1Id = match.participant1_id;
    const p2Id = match.participant2_id;

    let { resultType, winnerId, forfeiterId } = input;

    // Auto-infer from games if resultType not specified
    if (!resultType && input.games?.length) {
      const inferred = inferFromGames(input.games, match.stage.best_of);
      if (!inferred)
        return {
          success: false,
          message: "Cannot determine result from games yet.",
        };
      resultType = inferred.type;
      if (!winnerId) winnerId = inferred.winner === "p1" ? p1Id : p2Id;
    }

    // For FORFEIT, winner = the non-forfeiter
    if (resultType === "FORFEIT" && forfeiterId && !winnerId) {
      winnerId = forfeiterId === p1Id ? p2Id : p1Id;
    }

    if (!resultType)
      return { success: false, message: "resultType is required." };

    const side: WinnerSide =
      winnerId === p1Id ? "p1" : winnerId === p2Id ? "p2" : null;
    const pts = calcPoints(resultType, side);

    // Reverse previous standings if match already had a result
    const previous = await prisma.tournamentMatch.findUnique({
      where: { id: input.matchId },
      select: {
        status: true,
        result_type: true,
        winner_id: true,
        points1: true,
        points2: true,
        group_id: true,
      },
    });

    if (previous?.status === "COMPLETED" && previous.group_id) {
      await updateGroupStandings(
        previous.group_id,
        p1Id,
        p2Id,
        previous as any,
        true,
      );
    }

    // Write the result
    await prisma.tournamentMatch.update({
      where: { id: input.matchId },
      data: {
        status: resultType === "DOUBLE_FORFEIT" ? "SKIPPED" : "COMPLETED",
        result_type: resultType,
        winner_id: winnerId ?? null,
        games: input.games ? JSON.stringify(input.games) : undefined,
        points1: pts.p1,
        points2: pts.p2,
        notes: input.notes,
      },
    });

    // Update group standings
    if (match.group_id) {
      await updateGroupStandings(
        match.group_id,
        p1Id,
        p2Id,
        {
          result_type: resultType,
          winner_id: winnerId ?? null,
          points1: pts.p1,
          points2: pts.p2,
        },
        false,
      );
    }

    revalidatePath(`/dashboard/tournaments`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

async function updateGroupStandings(
  groupId: string,
  p1Id: string,
  p2Id: string,
  result: {
    result_type: string;
    winner_id: string | null;
    points1: number;
    points2: number;
  },
  reverse: boolean,
) {
  const m = reverse ? -1 : 1;
  const isDouble = result.result_type === "DOUBLE_FORFEIT";
  const w = result.winner_id;

  function delta(side: "p1" | "p2") {
    const isWinner = w === (side === "p1" ? p1Id : p2Id);
    const isLoser = w !== null && !isWinner;
    const pts = side === "p1" ? result.points1 : result.points2;
    return {
      played: isDouble ? 0 : m,
      wins: !isDouble && isWinner && result.result_type === "NORMAL" ? m : 0,
      tiebreak_wins:
        !isDouble && isWinner && result.result_type === "TIEBREAK" ? m : 0,
      tiebreak_loss:
        !isDouble && isLoser && result.result_type === "TIEBREAK" ? m : 0,
      losses: !isDouble && isLoser && result.result_type === "NORMAL" ? m : 0,
      forfeits:
        (result.result_type === "FORFEIT" && isLoser) || isDouble ? m : 0,
      points: pts * m,
      for: (side === "p1" ? result.points1 : result.points2) * m,
      against: (side === "p1" ? result.points2 : result.points1) * m,
    };
  }

  const d1 = delta("p1");
  const d2 = delta("p2");

  await prisma.$transaction([
    prisma.groupParticipant.update({
      where: {
        group_id_participant_id: { group_id: groupId, participant_id: p1Id },
      },
      data: {
        played: { increment: d1.played },
        wins: { increment: d1.wins },
        tiebreak_wins: { increment: d1.tiebreak_wins },
        tiebreak_loss: { increment: d1.tiebreak_loss },
        losses: { increment: d1.losses },
        forfeits: { increment: d1.forfeits },
        points: { increment: d1.points },
        points_for: { increment: d1.for },
        points_against: { increment: d1.against },
      },
    }),
    prisma.groupParticipant.update({
      where: {
        group_id_participant_id: { group_id: groupId, participant_id: p2Id },
      },
      data: {
        played: { increment: d2.played },
        wins: { increment: d2.wins },
        tiebreak_wins: { increment: d2.tiebreak_wins },
        tiebreak_loss: { increment: d2.tiebreak_loss },
        losses: { increment: d2.losses },
        forfeits: { increment: d2.forfeits },
        points: { increment: d2.points },
        points_for: { increment: d2.for },
        points_against: { increment: d2.against },
      },
    }),
  ]);
}

// ─── Standings ────────────────────────────────────────────────────────────────

export async function getGroupStandings(groupId: string) {
  await requireAuth();
  const rows = await prisma.groupParticipant.findMany({
    where: { group_id: groupId },
    include: { participant: true },
  });

  return rows
    .map((r) => ({ ...r, diff: r.points_for - r.points_against }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.diff !== a.diff) return b.diff - a.diff;
      return b.points_for - a.points_for;
    })
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// ─── Generate knockout bracket from group stage ───────────────────────────────

export async function generateKnockout(
  groupStageId: string,
  knockoutStageId: string,
  qualifiersPerGroup: number = 2,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();

    // 1. Finalise group standings
    const groupStage = await prisma.tournamentStage.findUniqueOrThrow({
      where: { id: groupStageId },
      include: { groups: true },
    });

    for (const group of groupStage.groups) {
      const standings = await getGroupStandings(group.id);
      await prisma.$transaction(
        standings.map((s) =>
          prisma.groupParticipant.update({
            where: { id: s.id },
            data: { final_rank: s.rank },
          }),
        ),
      );
    }
    await prisma.tournamentStage.update({
      where: { id: groupStageId },
      data: { status: "COMPLETED" },
    });

    // 2. Seed participants: rank 1 from each group, then rank 2, etc.
    const seeds: string[] = [];
    for (let rank = 1; rank <= qualifiersPerGroup; rank++) {
      for (const group of groupStage.groups) {
        const qualifier = await prisma.groupParticipant.findFirst({
          where: { group_id: group.id, final_rank: rank },
        });
        if (qualifier) seeds.push(qualifier.participant_id);
      }
    }

    const n = seeds.length;
    if (n < 2 || (n & (n - 1)) !== 0) {
      return {
        success: false,
        message: `Need a power-of-2 number of qualifiers (got ${n}). Adjust qualifiersPerGroup.`,
      };
    }

    // 3. Build bracket
    const knockoutStage = await prisma.tournamentStage.findUniqueOrThrow({
      where: { id: knockoutStageId },
      include: { matches: true },
    });
    if (knockoutStage.matches.length > 0) {
      return { success: false, message: "Knockout bracket already generated." };
    }

    const totalRounds = Math.log2(n);
    const matchIdByNumber = new Map<number, string>();
    let globalNum = 1;

    // Build round structure: Final(round=1) → Semis → QFs → ...
    const roundLayers: { round: number; count: number; label: string }[] = [];
    for (let d = 0; d < totalRounds; d++) {
      const round = Math.pow(2, d);
      const label =
        round === 1
          ? "Final"
          : round === 2
            ? "Semi-Final"
            : round === 4
              ? "Quarter-Final"
              : `Round of ${round * 2}`;
      roundLayers.unshift({ round, count: round, label });
    }

    // Create matches Final first (so we can wire nextMatchId)
    for (const { round, count, label } of roundLayers) {
      for (let i = 0; i < count; i++) {
        const created = await prisma.tournamentMatch.create({
          data: {
            stage_id: knockoutStageId,
            round,
            match_number: globalNum,
            label: count > 1 ? `${label} ${i + 1}` : label,
            status: "SCHEDULED",
          },
        });
        matchIdByNumber.set(globalNum++, created.id);
      }
    }

    // Wire nextMatchId
    for (let i = 1; i < roundLayers.length; i++) {
      const parent = roundLayers[i - 1];
      const child = roundLayers[i];
      const parentOffset = roundLayers
        .slice(0, i - 1)
        .reduce((s, r) => s + r.count, 1);
      const childOffset = roundLayers
        .slice(0, i)
        .reduce((s, r) => s + r.count, 1);

      for (let j = 0; j < child.count; j += 2) {
        const parentId = matchIdByNumber.get(parentOffset + Math.floor(j / 2))!;
        const c1 = matchIdByNumber.get(childOffset + j)!;
        const c2 = matchIdByNumber.get(childOffset + j + 1)!;
        await prisma.tournamentMatch.updateMany({
          where: { id: { in: [c1, c2] } },
          data: { next_match_id: parentId },
        });
      }
    }

    // Seed first round: 1v8, 2v7, 3v6, 4v5 pattern
    const firstRound = roundLayers[roundLayers.length - 1];
    const firstRoundOffset = roundLayers
      .slice(0, roundLayers.length - 1)
      .reduce((s, r) => s + r.count, 1);

    function buildOrder(size: number): number[] {
      if (size === 1) return [1];
      const prev = buildOrder(size / 2);
      return prev.flatMap((s) => [s, size + 1 - s]);
    }
    const order = buildOrder(n);

    for (let i = 0; i < firstRound.count; i++) {
      const matchId = matchIdByNumber.get(firstRoundOffset + i)!;
      const s1 = order[i * 2] - 1;
      const s2 = order[i * 2 + 1] - 1;
      await prisma.tournamentMatch.update({
        where: { id: matchId },
        data: {
          participant1_id: seeds[s1] ?? null,
          participant2_id: seeds[s2] ?? null,
        },
      });
    }

    await prisma.tournamentStage.update({
      where: { id: knockoutStageId },
      data: { status: "ACTIVE" },
    });

    revalidatePath(`/dashboard/tournaments`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// ─── Advance knockout winner ───────────────────────────────────────────────────
// Called automatically inside recordMatchResult for knockout stages.
// Can also be called manually if needed.

export async function advanceKnockoutWinner(
  matchId: string,
  winnerId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    await requireAdmin();
    const match = await prisma.tournamentMatch.findUniqueOrThrow({
      where: { id: matchId },
    });
    if (!match.next_match_id) return { success: true }; // Final — no next match

    const next = await prisma.tournamentMatch.findUniqueOrThrow({
      where: { id: match.next_match_id },
    });
    if (!next.participant1_id) {
      await prisma.tournamentMatch.update({
        where: { id: next.id },
        data: { participant1_id: winnerId },
      });
    } else if (!next.participant2_id) {
      await prisma.tournamentMatch.update({
        where: { id: next.id },
        data: { participant2_id: winnerId },
      });
    }

    revalidatePath(`/dashboard/tournaments`);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}
