import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import {
  getAdminSessionFromRequest,
  unauthorizedAdminResponse,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute<ResultSetHeader>(
      `INSERT INTO election_settings (id, is_ended, ended_at)
       VALUES (1, 1, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         is_ended = VALUES(is_ended),
         ended_at = VALUES(ended_at)`
    );

    const [tokenUpdate] = await connection.execute<ResultSetHeader>(
      "UPDATE tokens SET status = 'used', used_at = COALESCE(used_at, CURRENT_TIMESTAMP) WHERE status = 'active'"
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Pemira berhasil diakhiri.",
      affected_active_tokens: tokenUpdate.affectedRows,
    });
  } catch (error) {
    await connection.rollback();
    console.error("end-pemira error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengakhiri pemira." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
