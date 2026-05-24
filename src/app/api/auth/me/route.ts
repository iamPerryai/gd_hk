import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    // Private cache for 30s to avoid repeated DB lookups within a page session (M4 fix)
    return NextResponse.json(
      { user },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
        },
      },
    );
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null });
  }
}
