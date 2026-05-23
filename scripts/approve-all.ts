import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "..", ".env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { contents } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function main() {
  const result = await db
    .update(contents)
    .set({ audioStatus: "approved" })
    .where(eq(contents.audioStatus, "generated"));

  console.log("Updated audio_status to approved");

  const all = await db
    .select({
      contentNo: contents.contentNo,
      audioStatus: contents.audioStatus,
      reviewStatus: contents.reviewStatus,
    })
    .from(contents)
    .orderBy(contents.sortOrder);

  for (const r of all) {
    console.log(`${r.contentNo}  audio:${r.audioStatus}  review:${r.reviewStatus}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
