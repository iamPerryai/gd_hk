import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "..", ".env.local") });
import { generateContent } from "../src/lib/kimi";

async function main() {
  const scene = process.argv[2];
  const count = parseInt(process.argv[3] || "5", 10);

  if (!scene) {
    console.error("Usage: npx tsx scripts/generate-content.ts <scene> [count]");
    console.error("Example: npx tsx scripts/generate-content.ts Meeting 5");
    process.exit(1);
  }

  console.log(`Generating ${count} items for scene: ${scene}...\n`);

  try {
    const items = await generateContent({ scene, count });

    for (const item of items) {
      console.log("---");
      console.log(`Scene: ${item.scene}`);
      console.log(`Hook: ${item.hookText}`);
      // Show word-level segments
      const visual = item.segments.map((s) =>
        s.type === "en" ? `[${s.text} ${s.phonetic || ""} ${s.meaning || ""}]` : s.text
      ).join("");
      console.log(`Segments: ${visual}`);
      console.log(`Text: ${item.cantoneseText}`);
      console.log(`Main Keyword: ${item.mainKeyword.word} [${item.mainKeyword.ipa}] — ${item.mainKeyword.meaning}`);
      console.log(`Support: ${item.supportKeywords.map((k) => `${k.word}(${k.meaning})`).join(", ")}`);
      console.log(`Explanation: ${item.explanation}`);
      console.log(`Tags: ${item.tags.join(", ")}`);
    }

    console.log(`\nDone! Generated ${items.length} items.`);
  } catch (error) {
    console.error("Generation failed:", error);
    process.exit(1);
  }
}

main();
