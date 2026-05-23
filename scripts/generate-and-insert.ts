import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "..", ".env.local") });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { contents } from "../drizzle/schema";
import { generateContent, sceneDescriptions } from "../src/lib/kimi";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL!;
const neonSql = neon(DATABASE_URL);
const db = drizzle(neonSql);

const SCENE_PREFIXES: Record<string, string> = {
  "Meeting": "MEE",
  "Follow up": "FOL",
  "Approval": "APP",
  "Client": "CLI",
  "Teamwork": "TEA",
  "OT / Urgent": "OTU",
};

async function getNextContentNo(scene: string): Promise<number> {
  const prefix = SCENE_PREFIXES[scene];
  const result = await db
    .select({ maxNo: sql<string>`max(content_no)` })
    .from(contents)
    .where(sql`content_no LIKE ${prefix + "%"}`);

  const maxNo = result[0]?.maxNo;
  if (!maxNo) return 1;
  const num = parseInt(maxNo.replace(prefix, ""), 10);
  return isNaN(num) ? 1 : num + 1;
}

async function getCurrentSortOrder(scene: string): Promise<number> {
  const result = await db
    .select({ maxSort: sql<number>`max(sort_order)` })
    .from(contents);
  return (result[0]?.maxSort ?? 0) + 1;
}

async function main() {
  const targetScene = process.argv[2];
  const countPerScene = parseInt(process.argv[3] || "5", 10);

  const scenes = targetScene
    ? [targetScene]
    : Object.keys(SCENE_PREFIXES);

  let totalInserted = 0;

  for (const scene of scenes) {
    console.log(`\n📝 Generating ${countPerScene} items for "${scene}"...`);

    let items;
    try {
      items = await generateContent({ scene, count: countPerScene });
    } catch (err) {
      console.error(`  ❌ Generation failed for ${scene}:`, err);
      continue;
    }

    console.log(`  ✅ Generated ${items.length} items`);

    let nextSort = await getCurrentSortOrder(scene);
    let nextNo = await getNextContentNo(scene);
    const prefix = SCENE_PREFIXES[scene];

    for (const item of items) {
      try {
        const contentNo = `${prefix}${String(nextNo).padStart(3, "0")}`;

        await db.insert(contents).values({
          contentNo,
          scene: item.scene,
          hookText: item.hookText,
          cantoneseText: item.cantoneseText,
          explanation: item.explanation,
          mainKeyword: item.mainKeyword as any,
          supportKeywords: item.supportKeywords as any,
          segments: item.segments as any,
          tags: item.tags as any,
          reviewStatus: "draft",
          audioStatus: "pending",
          sortOrder: nextSort,
          sourceType: "kimi",
        });

        const enWords = item.segments?.filter((s: any) => s.type === "en").map((s: any) => s.text).join(", ") || "";
        console.log(`    ✓ ${contentNo}: [${enWords}] — ${item.cantoneseText.substring(0, 60)}...`);
        nextNo++;
        nextSort++;
        totalInserted++;
      } catch (err) {
        console.error(`    ✗ Failed to insert:`, err);
      }
    }
  }

  console.log(`\n🎉 Done! Inserted ${totalInserted} new items.`);
}

main().catch(console.error);
