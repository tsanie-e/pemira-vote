import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import {
  getAdminSessionFromRequest,
  unauthorizedAdminResponse,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

type ElectionRow = RowDataPacket & {
  is_ended: number;
};

type GeneratePayload = {
  count?: number;
};

const generateNumericToken = (length = 8) => {
  let pin = randomInt(1, 10).toString();
  for (let i = 1; i < length; i += 1) {
    pin += randomInt(0, 10).toString();
  }
  return pin;
};

export async function POST(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  let payload: GeneratePayload = {};
  try {
    payload = await request.json();
  } catch {
    // optional body
  }

  const countRaw = Number(payload.count ?? 1);
  const requestedCount =
    Number.isInteger(countRaw) && countRaw > 0 && countRaw <= 5000 ? countRaw : 0;

  if (requestedCount === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Jumlah token harus angka bulat antara 1 sampai 5000.",
      },
      { status: 400 }
    );
  }

  try {
    const [electionRows] = await pool.execute<ElectionRow[]>(
      "SELECT is_ended FROM election_settings WHERE id = 1 LIMIT 1"
    );

    if (Number(electionRows[0]?.is_ended ?? 0) === 1) {
      return NextResponse.json(
        { success: false, message: "Pemira sudah diakhiri. Token baru tidak bisa dibuat." },
        { status: 409 }
      );
    }

    const generatedTokens: string[] = [];
    const generatedSet = new Set<string>();
    const maxAttempts = requestedCount * 40;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (generatedTokens.length >= requestedCount) {
        break;
      }

      const token = generateNumericToken(8);
      if (generatedSet.has(token)) {
        continue;
      }

      try {
        await pool.execute<ResultSetHeader>(
          "INSERT INTO tokens (token, status) VALUES (?, 'active')",
          [token]
        );
        generatedSet.add(token);
        generatedTokens.push(token);
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "ER_DUP_ENTRY"
        ) {
          continue;
        }
        throw error;
      }
    }

    if (generatedTokens.length === 0) {
      return NextResponse.json(
        { success: false, message: "Gagal membuat token unik. Coba lagi." },
        { status: 500 }
      );
    }

    const generatedCount = generatedTokens.length;
    const preview = generatedTokens.slice(0, Math.min(10, generatedCount));

    return NextResponse.json({
      success: true,
      message:
        generatedCount === requestedCount
          ? `${generatedCount} token berhasil dibuat.`
          : `Hanya ${generatedCount} dari ${requestedCount} token yang berhasil dibuat.`,
      generated_count: generatedCount,
      requested_count: requestedCount,
      generated_tokens_preview: preview,
    });

  } catch (error) {
    console.error("generate token error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat generate token." },
      { status: 500 }
    );
  }
}
