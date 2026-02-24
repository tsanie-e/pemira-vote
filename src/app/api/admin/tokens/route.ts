import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import {
  getAdminSessionFromRequest,
  unauthorizedAdminResponse,
} from "@/lib/admin-auth";

type TokenRow = RowDataPacket & {
  id: number;
  token: string;
  status: "active" | "used";
  created_at: Date;
  used_at: Date | null;
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
      "SELECT COUNT(*) AS total FROM tokens"
    );
    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const [rows] = await pool.query<TokenRow[]>(
      `SELECT id, token, status, created_at, used_at
       FROM tokens
       ORDER BY created_at DESC
       LIMIT ${safePerPage} OFFSET ${safeOffset}`
    );

    return NextResponse.json({
      success: true,
      tokens: rows,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error("admin tokens error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data token." },
      { status: 500 }
    );
  }
}
