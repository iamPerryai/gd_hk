import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { generateContent } from "@/lib/kimi";
import { db } from "@/lib/db";
import { contents } from "../../../../../drizzle/schema";

export async function POST(request: Request) {
  try {
    // Basic admin protection
    const adminSecret = request.headers.get("x-admin-secret");
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { scene, count = 5 } = body;

    if (!scene) {
      return NextResponse.json({ error: "Missing scene" }, { status: 400 });
    }

    const items = await generateContent({ scene, count });

    // Insert generated items as drafts
    const inserted: { contentNo: string; cantoneseText: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // Find the next available content_no for this scene prefix
      const scenePrefix = scene.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase();
      const existingCount = await db
        .select()
        .from(contents)
        .where(eq(contents.scene, scene));

      const no = `${scenePrefix}${String(existingCount.length + i + 1).padStart(3, "0")}`;

      await db.insert(contents).values({
        contentNo: no,
        scene,
        hookText: item.hookText,
        cantoneseText: item.cantoneseText,
        explanation: item.explanation,
        mainKeyword: item.mainKeyword,
        supportKeywords: item.supportKeywords,
        segments: item.segments,
        tags: item.tags || [],
        reviewStatus: "draft",
        audioStatus: "pending",
      });

      inserted.push({ contentNo: no, cantoneseText: item.cantoneseText });
    }

    return NextResponse.json({ items: inserted });
  } catch (error) {
    console.error("Failed to generate content:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
