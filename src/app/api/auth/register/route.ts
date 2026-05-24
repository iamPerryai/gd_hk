import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "../../../../../drizzle/schema";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";

const PASSWORD_MIN_LENGTH = 8;

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

    if (username.length < 2 || username.length > 50) {
      return NextResponse.json(
        { error: "用户名长度应在 2-50 个字符之间" },
        { status: 400 },
      );
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `密码长度至少 ${PASSWORD_MIN_LENGTH} 个字符` },
        { status: 400 },
      );
    }

    // Rate limiting: 5 registrations per minute per IP
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateLimit = checkRateLimit(ip, {
      prefix: "register",
      maxRequests: 5,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后重试" },
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

    const passwordHash = await hashPassword(password);

    // Rely on DB UNIQUE constraint instead of pre-check to avoid TOCTOU race.
    // If username already exists, the insert throws a unique-violation error (code 23505).
    try {
      const [user] = await db
        .insert(users)
        .values({ username, passwordHash })
        .returning({ id: users.id, username: users.username });

      const token = await createToken(user.id, user.username);
      await setAuthCookie(token);

      return NextResponse.json({ user }, { status: 201 });
    } catch (insertError: unknown) {
      // Postgres unique violation — username already taken
      if (
        typeof insertError === "object" &&
        insertError !== null &&
        "code" in insertError &&
        (insertError as { code: string }).code === "23505"
      ) {
        return NextResponse.json(
          { error: "用户名已被占用" },
          { status: 409 },
        );
      }
      throw insertError; // re-throw for outer catch
    }
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 },
    );
  }
}
