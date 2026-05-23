import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, contentId, scene, anonymousId, metadata } = body;

    if (!eventName) {
      return NextResponse.json({ error: "Missing eventName" }, { status: 400 });
    }

    const validEvents = [
      "audio_play",
      "audio_complete",
      "keyword_expand",
      "feedback_click",
      "scene_filter_click",
    ];

    if (!validEvents.includes(eventName)) {
      return NextResponse.json({ error: "Invalid event name" }, { status: 400 });
    }

    await recordEvent({ eventName, contentId, scene, anonymousId, metadata });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record event:", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
