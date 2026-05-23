import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contents } from "../../../../../drizzle/schema";
import { synthesizeSpeech } from "@/lib/volcengine-tts";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30s timeout for TTS

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // Fetch content from DB
    const rows = await db
      .select({ cantoneseText: contents.cantoneseText })
      .from(contents)
      .where(eq(contents.id, id))
      .limit(1);

    const content = rows[0];
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Real-time TTS with timestamps
    const { audioBuffer, timestamps } = await synthesizeSpeech({
      text: content.cantoneseText,
    });

    const headers: Record<string, string> = {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
      "Content-Length": String(audioBuffer.byteLength),
    };

    // Embed timestamps in response header (base64-encoded JSON)
    // Frontend reads this header to drive synced highlighting
    if (timestamps.length > 0) {
      const tsJson = JSON.stringify(timestamps);
      headers["X-Timestamps"] = Buffer.from(tsJson).toString("base64");
    }

    return new NextResponse(audioBuffer, { status: 200, headers });
  } catch (error) {
    console.error("TTS audio generation failed:", error);
    return NextResponse.json(
      { error: "Audio generation failed" },
      { status: 500 },
    );
  }
}
