import { readFileSync, writeFileSync } from "fs";

const path = "src/lib/kimi.ts";
let content = readFileSync(path, "utf8");

// Match the two replace lines and replace with unicode-escaped versions
// Old: .replace(/[""???]/g, '"')
// New: .replace(/[“”＂]/g, '"')
content = content.replace(
  /\.replace\(\/\[[^\]]*\]\/g,\s*'"'\)/g,
  ".replace(/[\\u201C\\u201D\\uFF02]/g, '\"')"
);
content = content.replace(
  /\.replace\(\/\[[^\]]*\]\/g,\s*"'"\)/g,
  ".replace(/[\\u2018\\u2019\\uFF07]/g, \"'\")"
);

writeFileSync(path, content);
console.log("Fixed quotes in kimi.ts");
