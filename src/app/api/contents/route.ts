import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contents } from "../../../../drizzle/schema";
import { eq, and, asc, sql } from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scene = searchParams.get("scene");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions — scene filter pushed to DB (H2 fix)
    const conditions = [
      eq(contents.reviewStatus, "published"),
      eq(contents.audioStatus, "approved"),
    ];
    if (scene) {
      conditions.push(eq(contents.scene, scene));
    }

    // Count total matching rows for pagination metadata
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contents)
      .where(and(...conditions));

    // Fetch paginated rows (C3 fix)
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
      .where(and(...conditions))
      .orderBy(asc(contents.sortOrder))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json(
      {
        data: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      {
        headers: {
          // Cache for 5 minutes, serve stale for 10 minutes while revalidating
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch contents:", error);
    return NextResponse.json(
      { error: "Failed to fetch contents" },
      { status: 500 },
    );
  }
}
