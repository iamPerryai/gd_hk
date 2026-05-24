import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { createToken, verifyToken, TOKEN_MAX_AGE } from "@/lib/jwt";

const COOKIE_NAME = "auth_token";

export { createToken, verifyToken, TOKEN_MAX_AGE };

const COOKIE_OPTIONS_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

export { COOKIE_NAME };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    ...COOKIE_OPTIONS_BASE,
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    ...COOKIE_OPTIONS_BASE,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export type AuthUser = {
  id: string;
  username: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getTokenFromCookie();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // M5 fix: JWT now carries username — use it directly, fall back to DB
  if (payload.username) {
    return { id: payload.userId, username: payload.username };
  }

  // Fallback for legacy tokens that don't have username in payload
  const [user] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  return user ?? null;
}
