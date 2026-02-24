import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getCandidateProfile } from "@/lib/candidate-profiles";
import {
  getAdminSessionFromRequest,
  unauthorizedAdminResponse,
} from "@/lib/admin-auth";

type CandidateVoteRow = RowDataPacket & {
  id: number;
  name: string;
  photo: string;
  total_votes: number;
};

type TokenStatusRow = RowDataPacket & {
  status: "active" | "used";
  total: number;
};

type ElectionRow = RowDataPacket & {
  is_ended: number;
  ended_at: Date | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const [candidateRows] = await pool.execute<CandidateVoteRow[]>(
      `SELECT c.id, c.name, c.photo, COUNT(v.id) AS total_votes
       FROM candidates c
       LEFT JOIN votes v ON v.candidate_id = c.id
       GROUP BY c.id, c.name, c.photo
       ORDER BY c.id ASC`
    );

    const [statusRows] = await pool.execute<TokenStatusRow[]>(
      "SELECT status, COUNT(*) AS total FROM tokens GROUP BY status"
    );

    const [electionRows] = await pool.execute<ElectionRow[]>(
      "SELECT is_ended, ended_at FROM election_settings WHERE id = 1 LIMIT 1"
    );

    const tokenSummary = {
      active: 0,
      used: 0,
      total: 0,
    };

    statusRows.forEach((row) => {
      if (row.status === "active") {
        tokenSummary.active = Number(row.total);
      }
      if (row.status === "used") {
        tokenSummary.used = Number(row.total);
      }
    });
    tokenSummary.total = tokenSummary.active + tokenSummary.used;

    const totalVotes = candidateRows.reduce(
      (accumulator, row) => accumulator + Number(row.total_votes),
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        candidateVotes: candidateRows.map((row) => ({
          id: row.id,
          name: getCandidateProfile(row.id, row.name).name,
          photo: row.photo,
          total_votes: Number(row.total_votes),
        })),
        tokenSummary,
        totalVotes,
        electionStatus: {
          isEnded: Number(electionRows[0]?.is_ended ?? 0) === 1,
          ended_at: electionRows[0]?.ended_at ?? null,
        },
      },
    });
  } catch (error) {
    console.error("admin stats error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil statistik voting." },
      { status: 500 }
    );
  }
}
