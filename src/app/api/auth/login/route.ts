import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "../../../../../drizzle/schema";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";

// Lazy-initialized dummy bcrypt hash so the password-verify path takes
// the same time whether the user exists or not (mitigates timing side channel).
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = bcrypt.hash("__dummy_pwd__", 12).catch(() => {
      // If bcrypt fails, generate a new valid placeholder so timing is still constant
      return bcrypt.hash("__dummy_fallback__", 12);
    });
  }
  return dummyHashPromise;
}

export async function POST(request: Request) {
  try {
    const { username, password, turnstileToken } = await request.json();

    // Verify Turnstile if configured
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const ok = await verifyTurnstile(turnstileToken);
      if (!ok) {
        return NextResponse.json({ error: "人机验证失败" }, { status: 400 });
      }
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "用户名和密码不能为空" },
        { status: 400 },
      );
    }

    // Rate limiting: 5 attempts per minute per IP
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateLimit = checkRateLimit(ip, {
      prefix: "login",
      maxRequests: 5,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "登录尝试过多，请稍后重试" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    // Fetch user (may not exist)
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    // Always run bcrypt.compare to prevent timing side-channel attacks.
    // When the user doesn't exist, compare against a dummy hash so the
    // response time is indistinguishable from a valid-username case.
    const hash = user?.passwordHash ?? (await getDummyHash());
    const valid = await verifyPassword(password, hash);

    if (!user || !valid) {
      return NextResponse.json(
        { error: "用户名或密码错误" },
        { status: 401 },
      );
    }

    const token = await createToken(user.id, user.username);
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 },
    );
  }
}
