import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "..", ".env.local") });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { contents } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

const db = drizzle(neon(process.env.DATABASE_URL!));

async function main() {
  // Approve all pending/draft items
  await db
    .update(contents)
    .set({ reviewStatus: "published", audioStatus: "approved" })
    .where(eq(contents.reviewStatus, "draft"));

  console.log("All draft items approved.");

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(contents);
  console.log("Total items:", total[0].count);

  const byScene = await db
    .select({ scene: contents.scene, count: sql<number>`count(*)` })
    .from(contents)
    .groupBy(contents.scene)
    .orderBy(contents.scene);

  for (const r of byScene) {
    console.log(`  ${r.scene}: ${r.count}`);
  }
}

main().catch(console.error);
