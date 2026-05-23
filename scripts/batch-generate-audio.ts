import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "..", ".env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import { contents } from "../drizzle/schema";
import { synthesizeSpeech } from "../src/lib/volcengine-tts";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const AUDIO_DIR = resolve(__dirname, "..", "public", "audio");

async function main() {
  // Get all contents
  const allItems = await db
    .select()
    .from(contents)
    .orderBy(contents.sortOrder);

  console.log(`Found ${allItems.length} items total\n`);

  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of allItems) {
    const fileName = `${item.contentNo}.mp3`;
    const filePath = resolve(AUDIO_DIR, fileName);

    // Skip if file already exists on disk
    if (fs.existsSync(filePath)) {
      console.log(`[SKIP] ${item.contentNo} — file exists`);
      skipped++;
      continue;
    }

    try {
      console.log(`[GENERATING] ${item.contentNo}: ${item.cantoneseText}`);

      const { audioBuffer } = await synthesizeSpeech({
        text: item.cantoneseText,
      });

      fs.writeFileSync(filePath, Buffer.from(audioBuffer));

      await db
        .update(contents)
        .set({
          audioUrl: `/audio/${fileName}`,
          audioStatus: "generated",
        })
        .where(eq(contents.id, item.id));

      console.log(`  [OK] ${fileName} (${Buffer.from(audioBuffer).length} bytes)`);
      success++;

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.error(`  [FAIL] ${item.contentNo}:`, error);
      failed++;
    }
  }

  console.log(`\nDone! Success: ${success}, Skipped: ${skipped}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
