import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getCandidateProfile } from "@/lib/candidate-profiles";

type CandidateRow = RowDataPacket & {
  id: number;
  name: string;
  photo: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await pool.execute<CandidateRow[]>(
      "SELECT id, name, photo FROM candidates ORDER BY id ASC"
    );

    const cacheBuster = Date.now();
    const candidates = rows.map((row) => {
      const profile = getCandidateProfile(row.id, row.name);
      return {
        id: row.id,
        name: profile.name,
        class_name: profile.className,
        photo: `${row.photo}${row.photo.includes("?") ? "&" : "?"}v=${cacheBuster}`,
      };
    });

    return NextResponse.json({
      success: true,
      candidates,
    });
  } catch (error) {
    console.error("get-candidates error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data kandidat." },
      { status: 500 }
    );
  }
}
