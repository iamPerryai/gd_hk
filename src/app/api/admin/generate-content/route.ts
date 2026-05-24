import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { generateContent } from "@/lib/kimi";
import { db } from "@/lib/db";
import { contents } from "../../../../../drizzle/schema";

const MAX_RETRIES = 3;

export async function POST(request: Request) {
  try {
    // Auth via middleware (JWT cookie) or legacy admin-secret header
    const userId = request.headers.get("x-user-id");
    const adminSecret = request.headers.get("x-admin-secret");
    if (
      !userId &&
      (!adminSecret || adminSecret !== process.env.ADMIN_SECRET)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { scene, count = 5 } = body;

    if (!scene) {
      return NextResponse.json({ error: "Missing scene" }, { status: 400 });
    }

    const items = await generateContent({ scene, count });

    // Generate content with retry on unique-violation (handles rare concurrent inserts)
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const inserted = await db.transaction(async (tx) => {
          // C1 fix: single count query outside the loop — only fetch content_no column
          const existing = await tx
            .select({ contentNo: contents.contentNo })
            .from(contents)
            .where(eq(contents.scene, scene))
            // Lock rows to prevent concurrent content_no collisions (C2 fix)
            .for("update");

          const existingCount = existing.length;

          const scenePrefix = scene
            .replace(/[^a-zA-Z]/g, "")
            .substring(0, 3)
            .toUpperCase();

          // Build all insert values at once (C1 fix: batch insert)
          const values = items.map((item, i) => {
            const no = `${scenePrefix}${String(existingCount + i + 1).padStart(3, "0")}`;
            return {
              contentNo: no,
              scene,
              hookText: item.hookText,
              cantoneseText: item.cantoneseText,
              explanation: item.explanation,
              mainKeyword: item.mainKeyword,
              supportKeywords: item.supportKeywords,
              segments: item.segments,
              tags: item.tags || [],
              reviewStatus: "draft" as const,
              audioStatus: "pending" as const,
            };
          });

          // Batch insert all items in a single query
          const result = await tx.insert(contents).values(values).returning({
            contentNo: contents.contentNo,
            cantoneseText: contents.cantoneseText,
          });

          return result;
        });

        return NextResponse.json({ items: inserted });
      } catch (insertError: unknown) {
        // On unique violation, retry — another request may have taken the content_no slots
        const isUniqueViolation =
          typeof insertError === "object" &&
          insertError !== null &&
          "code" in insertError &&
          (insertError as { code: string }).code === "23505";

        if (!isUniqueViolation || attempt === MAX_RETRIES - 1) {
          throw insertError;
        }
        // else: retry the entire transaction with fresh count
      }
    }

    // Should never reach here, but TypeScript needs it
    throw new Error("Max retries exceeded");
  } catch (error) {
    console.error("Failed to generate content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 },
    );
  }
}
