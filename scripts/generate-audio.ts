import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "..", ".env.local") });
import * as fs from "fs";
import * as path from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { contents } from "../drizzle/schema";
import { synthesizeSpeech } from "../src/lib/volcengine-tts";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const AUDIO_DIR = path.resolve(__dirname, "..", "public", "audio");

async function main() {
  const contentNo = process.argv[2];

  if (!contentNo) {
    console.error("Usage: npx tsx scripts/generate-audio.ts <content_no>");
    console.error("Example: npx tsx scripts/generate-audio.ts MEE001");
    process.exit(1);
  }

  // Ensure audio directory exists
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  // Find the content
  const rows = await db
    .select()
    .from(contents)
    .where(eq(contents.contentNo, contentNo))
    .limit(1);

  const content = rows[0];
  if (!content) {
    console.error(`Content ${contentNo} not found`);
    process.exit(1);
  }

  console.log(`Generating audio for: ${content.cantoneseText}`);

  // Update status to generating
  await db
    .update(contents)
    .set({ audioStatus: "generating" })
    .where(eq(contents.id, content.id));

  try {
    const { audioBuffer } = await synthesizeSpeech({
      text: content.cantoneseText,
    });

    const fileName = `${contentNo}.mp3`;
    const filePath = path.join(AUDIO_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(audioBuffer));

    console.log(`Audio saved: public/audio/${fileName}`);

    // Update audio_url and status
    await db
      .update(contents)
      .set({
        audioUrl: `/audio/${fileName}`,
        audioStatus: "generated",
      })
      .where(eq(contents.id, content.id));

    console.log(`Content ${contentNo} updated with audio URL`);
    console.log("\nPlease manually review the audio, then update audio_status to 'approved'.");
  } catch (error) {
    console.error("Audio generation failed:", error);

    // Revert status to pending
    await db
      .update(contents)
      .set({ audioStatus: "pending" })
      .where(eq(contents.id, content.id));

    process.exit(1);
  }

  process.exit(0);
}

main();
