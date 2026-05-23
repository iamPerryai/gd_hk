"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TimestampEntry } from "@/lib/volcengine-tts";

export interface KeywordInfo {
  meaning: string;
  ipa?: string;
}

interface SyncedTextProps {
  text: string;
  timestamps: TimestampEntry[];
  keywords: string[];
  /** Map of lowercase word → meaning + optional IPA, for tooltip popup */
  keywordInfo: Record<string, KeywordInfo>;
  audioEl: HTMLAudioElement | null;
  onEnded?: () => void;
}

interface Segment {
  text: string;
  start: number;
  end: number;
  isKeyword: boolean;
  /** Precomputed tooltip text: "词义 [IPA]" */
  tips: string;
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

/** Build a keyword info lookup from main + support keywords */
export function buildKeywordInfo(
  mainKeyword: unknown,
  supportKeywords: unknown,
): Record<string, KeywordInfo> {
  const map: Record<string, KeywordInfo> = {};
  try {
    const main = mainKeyword as {
      word?: string; meaning?: string; ipa?: string;
    };
    if (main?.word && main?.meaning) {
      map[main.word.toLowerCase()] = {
        meaning: main.meaning,
        ipa: main.ipa,
      };
    }
    const supports = supportKeywords as Array<{
      word?: string; meaning?: string;
    }> | undefined;
    if (Array.isArray(supports)) {
      for (const s of supports) {
        if (s?.word && s?.meaning) {
          map[s.word.toLowerCase()] = { meaning: s.meaning };
        }
      }
    }
  } catch {
    // ignore
  }
  return map;
}

export default function SyncedText({
  text: _text,
  timestamps,
  keywords,
  keywordInfo,
  audioEl,
  onEnded,
}: SyncedTextProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const rafRef = useRef<number>(0);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Build segments from timestamps, tagging keyword matches + tooltip data
  const segments: Segment[] = timestamps.map((ts) => {
    const isKeyword = keywords.some(
      (k) => k.toLowerCase() === ts.text.toLowerCase(),
    );
    const info = keywordInfo[ts.text.toLowerCase()];
    const tips = info
      ? info.ipa
        ? `${info.meaning} [${info.ipa}]`
        : info.meaning
      : "";
    return {
      text: ts.text,
      start: ts.start_time,
      end: ts.end_time,
      isKeyword,
      tips,
    };
  });

  // Store segments in a ref so the RAF callback never needs to be re-created
  // when segments change. This prevents the useEffect cleanup/setup churn
  // that can cancel the RAF loop mid-flight.
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  // Only depends on audioEl — uses refs for everything else
  const handleTimeUpdate = useCallback(() => {
    if (!audioEl) return;
    const ms = audioEl.currentTime * 1000;
    const segs = segmentsRef.current;

    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (ms >= seg.start && ms < seg.end) {
        setActiveIdx(i);
        // Continue the RAF loop — never return early
        rafRef.current = requestAnimationFrame(handleTimeUpdate);
        return;
      }
    }

    // After last segment
    if (segs.length > 0 && ms >= segs[segs.length - 1].end) {
      setActiveIdx(null);
      onEndedRef.current?.();
    } else {
      setActiveIdx(null);
    }

    rafRef.current = requestAnimationFrame(handleTimeUpdate);
  }, [audioEl]);

  // Wire up audio events and start/stop the RAF loop when audioEl changes
  useEffect(() => {
    if (!audioEl) return;

    const onPlay = () => {
      rafRef.current = requestAnimationFrame(handleTimeUpdate);
    };
    const onPause = () => {
      cancelAnimationFrame(rafRef.current);
    };
    const onEnded = () => {
      cancelAnimationFrame(rafRef.current);
      setActiveIdx(null);
    };

    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);
    audioEl.addEventListener("ended", onEnded);

    // If audio is already playing when this component mounts
    // (e.g. onReady fires after play() has already started),
    // kick off the RAF loop immediately.
    if (!audioEl.paused) {
      rafRef.current = requestAnimationFrame(handleTimeUpdate);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
      audioEl.removeEventListener("ended", onEnded);
    };
  }, [audioEl, handleTimeUpdate]);

  if (segments.length === 0) {
    return <span>{_text}</span>;
  }

  return (
    <span className="synced-text">
      {segments.map((seg, i) => (
        <span
          key={i}
          className={`synced-word ${seg.isKeyword ? "keyword-highlight" : ""} ${
            i === activeIdx ? "synced-active" : ""
          }`}
          data-start={seg.start}
          data-end={seg.end}
          data-tips={seg.tips}
        >
          {seg.text}
        </span>
      ))}
    </span>
  );
}
