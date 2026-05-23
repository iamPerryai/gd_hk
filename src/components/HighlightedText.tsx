interface HighlightedTextProps {
  text: string;
  keywords: string[];
}

export default function HighlightedText({ text, keywords }: HighlightedTextProps) {
  if (keywords.length === 0) return <span>{text}</span>;

  // Build regex that matches keywords case-insensitively, as whole words where possible
  const escaped = keywords
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length); // longer first to avoid partial matches

  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <span>
      {parts.map((part, i) => {
        const isKeyword = keywords.some(
          (k) => k.toLowerCase() === part.toLowerCase(),
        );
        return isKeyword ? (
          <span key={i} className="keyword-highlight">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
}

/** Collect all English keywords from an item for highlighting */
export function collectKeywords(
  mainKeyword: unknown,
  supportKeywords: unknown,
): string[] {
  const words: string[] = [];
  try {
    const main = mainKeyword as { word?: string };
    if (main?.word) words.push(main.word);

    const supports = supportKeywords as Array<{ word?: string }> | undefined;
    if (Array.isArray(supports)) {
      for (const s of supports) {
        if (s?.word) words.push(s.word);
      }
    }
  } catch {
    // ignore
  }
  return words;
}
