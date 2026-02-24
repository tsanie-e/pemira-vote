import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { getVotingPinCandidates } from "@/lib/pin";

type VotePayload = {
  pin?: string;
  candidateId?: number;
};

type TokenRow = RowDataPacket & {
  id: number;
  token: string;
};

type CandidateRow = RowDataPacket & {
  id: number;
};

type ElectionRow = RowDataPacket & {
  is_ended: number;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: VotePayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Payload tidak valid." },
      { status: 400 }
    );
  }

  const pinCandidates = getVotingPinCandidates(String(payload.pin ?? "").trim());
  const candidateId = Number(payload.candidateId);

  if (pinCandidates.length === 0) {
    return NextResponse.json(
      { success: false, message: "PIN harus berupa angka 5 sampai 8 digit." },
      { status: 400 }
    );
  }

  if (!Number.isInteger(candidateId) || candidateId <= 0) {
    return NextResponse.json(
      { success: false, message: "Kandidat tidak valid." },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [electionRows] = await connection.execute<ElectionRow[]>(
      "SELECT is_ended FROM election_settings WHERE id = 1 LIMIT 1 FOR UPDATE"
    );

    if (Number(electionRows[0]?.is_ended ?? 0) === 1) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "Pemira sudah diakhiri. Voting ditutup." },
        { status: 403 }
      );
    }

    let tokenId: number | null = null;
    for (const candidate of pinCandidates) {
      const [tokenRows] = await connection.execute<TokenRow[]>(
        "SELECT id, token FROM tokens WHERE token = ? AND status = 'active' LIMIT 1 FOR UPDATE",
        [candidate]
      );
      if (tokenRows.length > 0) {
        tokenId = tokenRows[0].id;
        break;
      }
    }

    if (tokenId === null) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "PIN tidak valid atau sudah digunakan." },
        { status: 401 }
      );
    }

    const [candidateRows] = await connection.execute<CandidateRow[]>(
      "SELECT id FROM candidates WHERE id = ? LIMIT 1",
      [candidateId]
    );

    if (candidateRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "Kandidat tidak ditemukan." },
        { status: 404 }
      );
    }

    await connection.execute<ResultSetHeader>(
      "INSERT INTO votes (token_id, candidate_id) VALUES (?, ?)",
      [tokenId, candidateId]
    );

    await connection.execute<ResultSetHeader>(
      "UPDATE tokens SET status = 'used', used_at = CURRENT_TIMESTAMP WHERE id = ?",
      [tokenId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Vote berhasil disimpan.",
    });
  } catch (error: unknown) {
    await connection.rollback();

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        { success: false, message: "PIN sudah pernah digunakan untuk voting." },
        { status: 409 }
      );
    }

    console.error("vote error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menyimpan vote." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
