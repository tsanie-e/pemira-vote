import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import {
  createAdminSessionToken,
  setAdminSessionCookie,
} from "@/lib/admin-auth";

type LoginPayload = {
  email?: string;
  password?: string;
};

type AdminRow = RowDataPacket & {
  id: number;
  email: string;
  password_hash: string;
};

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: LoginPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Payload tidak valid." },
      { status: 400 }
    );
  }

  const email = String(payload.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(payload.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email dan password wajib diisi." },
      { status: 400 }
    );
  }

  try {
    const [rows] = await pool.execute<AdminRow[]>(
      "SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah." },
        { status: 401 }
      );
    }

    const admin = rows[0];
    const passwordMatch = await compare(password, admin.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Login admin berhasil.",
    });

    setAdminSessionCookie(response, createAdminSessionToken(admin.email));
    return response;
  } catch (error) {
    console.error("admin login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat login." },
      { status: 500 }
    );
  }
}
