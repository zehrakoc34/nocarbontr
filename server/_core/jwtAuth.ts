import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookies } from "cookie";
import type { Request } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./env";

const getSecret = () => {
  const secret = ENV.cookieSecret || "nocarbontr-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
};

export interface SessionPayload {
  userId: number;
  email: string;
  name: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
    .sign(getSecret());
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const { userId, email, name } = payload as Record<string, unknown>;
    if (typeof userId !== "number" || typeof email !== "string") return null;
    return { userId, email, name: typeof name === "string" ? name : "" };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  return parseCookies(cookieHeader)[COOKIE_NAME];
}
