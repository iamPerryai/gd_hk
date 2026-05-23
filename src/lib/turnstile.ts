/**
 * Server-side Turnstile verification.
 * Called from API routes to validate the client-side token.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // If no secret key is configured, skip verification (dev mode)
    console.warn("TURNSTILE_SECRET_KEY not set — skipping Turnstile verification");
    return true;
  }

  try {
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token }),
    });

    const data = await resp.json();
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    // Fail open in case of network errors
    return true;
  }
}
