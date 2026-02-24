import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type AdminSessionPayload = {
  email: string;
  exp: number;
};

export const ADMIN_SESSION_COOKIE = "pemira_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "replace-this-with-a-secure-secret";

const signPayload = (payloadBase64: string) => {
  return createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");
};

export const createAdminSessionToken = (email: string) => {
  const payload: AdminSessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
};

export const verifyAdminSessionToken = (token?: string | null) => {
  if (!token) {
    return null;
  }

  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payloadBase64);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as AdminSessionPayload;

    if (!payload.email || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

export const getAdminSessionFromRequest = (request: NextRequest) => {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
};

export const setAdminSessionCookie = (
  response: NextResponse,
  token: string
) => {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
};

export const clearAdminSessionCookie = (response: NextResponse) => {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
};

export const unauthorizedAdminResponse = () =>
  NextResponse.json(
    { success: false, message: "Sesi admin tidak valid. Silakan login ulang." },
    { status: 401 }
  );
