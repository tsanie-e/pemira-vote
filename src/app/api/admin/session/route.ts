import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({
      success: true,
      authenticated: false,
    });
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    email: session.email,
  });
}
