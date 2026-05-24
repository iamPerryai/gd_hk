import { SignJWT, jwtVerify } from "jose";

// Encode the secret once at module load time (LW-3 fix)
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me",
);

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const TOKEN_EXPIRATION = `${TOKEN_MAX_AGE}s`;

export interface TokenPayload {
  userId: string;
  username: string;
}

export async function createToken(
  userId: string,
  username: string,
): Promise<string> {
  return new SignJWT({ userId, username } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.userId || !payload.username) return null;
    return {
      userId: payload.userId as string,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

export { TOKEN_MAX_AGE };
