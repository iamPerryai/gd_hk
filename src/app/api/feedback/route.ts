import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedbacks } from "../../../../drizzle/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentId, feedbackType, anonymousId } = body;

    if (!contentId || !feedbackType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validTypes = ["useful", "normal", "unnatural"];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json({ error: "Invalid feedback type" }, { status: 400 });
    }

    await db.insert(feedbacks).values({
      contentId,
      feedbackType,
      anonymousId: anonymousId || null,
      userAgent: request.headers.get("user-agent") || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
