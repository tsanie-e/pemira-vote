import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getVotingPinCandidates } from "@/lib/pin";

type TokenRow = RowDataPacket & {
  id: number;
  token: string;
  status: "active" | "used";
};

type ElectionRow = RowDataPacket & {
  is_ended: number;
};

type CountRow = RowDataPacket & {
  total: number;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: { pin?: string; token?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Payload tidak valid." },
      { status: 400 }
    );
  }

  const pinRaw = String(payload.pin ?? payload.token ?? "").trim();
  const pinCandidates = getVotingPinCandidates(pinRaw);

  if (pinCandidates.length === 0) {
    return NextResponse.json(
      { success: false, message: "PIN harus berupa angka 5 sampai 8 digit." },
      { status: 400 }
    );
  }

  try {
    const [electionRows] = await pool.execute<ElectionRow[]>(
      "SELECT is_ended FROM election_settings WHERE id = 1 LIMIT 1"
    );

    if (Number(electionRows[0]?.is_ended ?? 0) === 1) {
      return NextResponse.json(
        { success: false, message: "Pemira sudah diakhiri. Voting ditutup." },
        { status: 403 }
      );
    }

    const [activeRows] = await pool.execute<CountRow[]>(
      "SELECT COUNT(*) AS total FROM tokens WHERE status = 'active'"
    );

    if (Number(activeRows[0]?.total ?? 0) === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Belum ada token aktif. Silakan generate token terlebih dahulu di dashboard admin.",
        },
        { status: 409 }
      );
    }

    let matchedToken: string | null = null;
    for (const candidate of pinCandidates) {
      const [rows] = await pool.execute<TokenRow[]>(
        "SELECT id, token, status FROM tokens WHERE token = ? AND status = 'active' LIMIT 1",
        [candidate]
      );
      if (rows.length > 0) {
        matchedToken = rows[0].token;
        break;
      }
    }

    if (!matchedToken) {
      return NextResponse.json(
        {
          success: false,
          message: "PIN tidak valid atau sudah digunakan.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PIN valid.",
      pin: matchedToken,
    });
  } catch (error) {
    console.error("verify-token error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
