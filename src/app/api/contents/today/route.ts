import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contents } from "../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
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

    return NextResponse.json(today);
  } catch (error) {
    console.error("Failed to fetch today content:", error);
    return NextResponse.json({ error: "Failed to fetch today content" }, { status: 500 });
  }
}
