import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contents } from "../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    // Select specific columns instead of wildcard (M2 fix)
    const rows = await db
      .select({
        id: contents.id,
        contentNo: contents.contentNo,
        scene: contents.scene,
        hookText: contents.hookText,
        cantoneseText: contents.cantoneseText,
        explanation: contents.explanation,
        mainKeyword: contents.mainKeyword,
        supportKeywords: contents.supportKeywords,
        tags: contents.tags,
        audioUrl: contents.audioUrl,
        audioStatus: contents.audioStatus,
        reviewStatus: contents.reviewStatus,
        isToday: contents.isToday,
        sortOrder: contents.sortOrder,
        createdAt: contents.createdAt,
      })
      .from(contents)
      .where(
        and(
          eq(contents.reviewStatus, "published"),
          eq(contents.audioStatus, "approved"),
          eq(contents.isToday, true),
        ),
      )
      .limit(1);

    const today = rows[0] || null;

    // Cache for 60 seconds on CDN/browser, serve stale for 5 minutes (M1 fix)
    return NextResponse.json(today, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch today content:", error);
    return NextResponse.json(
      { error: "Failed to fetch today content" },
      { status: 500 },
    );
  }
}
