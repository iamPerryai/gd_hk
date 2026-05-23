import { cookies } from "next/headers";

const COOKIE_NAME = "anon_id";

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "anon_";
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getAnonymousId(): Promise<string> {
  const cookieStore = await cookies();
  let anonId = cookieStore.get(COOKIE_NAME)?.value;
  if (!anonId) {
    anonId = generateId();
    cookieStore.set(COOKIE_NAME, anonId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }
  return anonId;
}
