import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contents } from "../../../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scene = searchParams.get("scene");

    const conditions = [
      eq(contents.reviewStatus, "published"),
      eq(contents.audioStatus, "approved"),
    ];

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
      .orderBy(asc(contents.sortOrder));

    const filtered = scene ? rows.filter((r) => r.scene === scene) : rows;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Failed to fetch contents:", error);
    return NextResponse.json({ error: "Failed to fetch contents" }, { status: 500 });
  }
}
