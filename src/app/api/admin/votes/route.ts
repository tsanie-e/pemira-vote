import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getCandidateProfile } from "@/lib/candidate-profiles";
import {
  getAdminSessionFromRequest,
  unauthorizedAdminResponse,
} from "@/lib/admin-auth";

type VoteRow = RowDataPacket & {
  id: number;
  token: string | null;
  candidate_id: number | null;
  candidate_name: string | null;
  created_at: Date;
};

type CountRow = RowDataPacket & {
  total: number;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const pageRaw = Number(searchParams.get("page") ?? 1);
    const perPageRaw = Number(searchParams.get("per_page") ?? 20);
    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const perPage =
      Number.isInteger(perPageRaw) && perPageRaw >= 5 && perPageRaw <= 100
        ? perPageRaw
        : 20;
    const offset = (page - 1) * perPage;
    const safePerPage = Math.min(Math.max(perPage, 5), 100);
    const safeOffset = Math.max(offset, 0);

    const [countRows] = await pool.execute<CountRow[]>(
      "SELECT COUNT(*) AS total FROM votes"
    );
    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const [rows] = await pool.query<VoteRow[]>(
      `SELECT v.id, t.token, c.id AS candidate_id, c.name AS candidate_name, v.created_at
       FROM votes v
       LEFT JOIN tokens t ON t.id = v.token_id
       LEFT JOIN candidates c ON c.id = v.candidate_id
       ORDER BY v.created_at DESC
       LIMIT ${safePerPage} OFFSET ${safeOffset}`
    );

    return NextResponse.json({
      success: true,
      votes: rows.map((row) => ({
        ...row,
        token: row.token ?? "-",
        candidate_name: getCandidateProfile(
          Number(row.candidate_id ?? 0),
          String(row.candidate_name ?? "Kandidat Tidak Ditemukan")
        ).name,
      })),
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error("admin votes error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data voting." },
      { status: 500 }
    );
  }
}
