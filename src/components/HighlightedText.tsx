"use client";

import { useMemo } from "react";

interface HighlightedTextProps {
  text: string;
  keywords: string[];
}

export default function HighlightedText({ text, keywords }: HighlightedTextProps) {
  // Move regex construction + split + keyword lookup into useMemo.
  // Uses a Set for O(1) keyword matching instead of O(n×m) keywords.some().
  const parts = useMemo(() => {
    if (keywords.length === 0) return null;

    const keywordSet = new Set(keywords.map((k) => k.toLowerCase()));

    // Escape regex special chars, sort longer first to avoid partial matches
    const escaped = keywords
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);

    const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
    const split = text.split(pattern);

    return split.map((part) => ({
      text: part,
      isKeyword: keywordSet.has(part.toLowerCase()),
    }));
  }, [text, keywords]);

  if (!parts) return <span>{text}</span>;

  return (
    <span>
      {parts.map((part, i) =>
        part.isKeyword ? (
          <span key={i} className="keyword-highlight">
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
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
