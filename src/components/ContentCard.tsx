"use client";

import { useState, useCallback } from "react";
import AudioPlayer from "./AudioPlayer";
import FeedbackButtons from "./FeedbackButtons";
import SyncedText, { collectKeywords, buildKeywordInfo } from "./SyncedText";
import { useVoice } from "@/lib/voice-context";
import type { ContentListItem } from "@/types/content";
import type { TimestampEntry } from "@/lib/volcengine-tts";

export default function ContentCard({ item }: { item: ContentListItem }) {
  const [showSupport, setShowSupport] = useState(false);
  const [syncedAudio, setSyncedAudio] = useState<HTMLAudioElement | null>(null);
  const [timestamps, setTimestamps] = useState<TimestampEntry[] | null>(null);
  const { currentVoice } = useVoice();

  const mainKw = item.mainKeyword as {
    word: string; meaning: string; example?: string; ipa?: string; partOfSpeech?: string;
  };
  const supportKws = item.supportKeywords as Array<{ word: string; meaning: string }>;
  const allKeywords = collectKeywords(item.mainKeyword, item.supportKeywords);
  const keywordInfo = buildKeywordInfo(item.mainKeyword, item.supportKeywords);

  const handleAudioReady = useCallback(
    (audioEl: HTMLAudioElement, ts: TimestampEntry[]) => {
      setSyncedAudio(audioEl);
      setTimestamps(ts);
    },
    [],
  );

  const handleAudioEnded = useCallback(() => {
    setSyncedAudio(null);
  }, []);

  return (
    <article className="bg-[#F7F6F0] border border-[#E6E4DA] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.10)] transition-shadow overflow-hidden">
      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6E4DA]">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 bg-[#4A7C59]/10 text-[#4A7C59] text-xs font-semibold rounded-full tracking-wide">
            {item.scene}
          </span>
          {item.contentNo && (
            <span className="text-xs text-[#9B9B9B] font-mono">
              #{item.contentNo}
            </span>
          )}
        </div>
        {supportKws.length > 0 && (
          <button
            onClick={() => setShowSupport(!showSupport)}
            className="text-xs font-medium text-[#6B6B6B] hover:text-[#2B2B2B] transition-colors"
          >
            {showSupport ? "收起" : `+${supportKws.length} 辅助词`}
          </button>
        )}
      </div>

      {/* ── Hook line ── */}
      {item.hookText && (
        <p className="px-5 pt-4 text-sm text-[#8E8E8E] leading-relaxed">
          {item.hookText}
        </p>
      )}

      {/* ── Sentence + Play ── */}
      <div className="px-5 pt-3 flex items-start justify-between gap-4">
        <p className="text-lg sm:text-xl font-serif leading-[2.4] tracking-wide text-[#2B2B2B] flex-1">
          {timestamps ? (
            <SyncedText
              text={item.cantoneseText}
              timestamps={timestamps}
              keywords={allKeywords}
              keywordInfo={keywordInfo}
              audioEl={syncedAudio}
              onEnded={handleAudioEnded}
            />
          ) : (
            <SyncedText
              text={item.cantoneseText}
              timestamps={[]}
              keywords={allKeywords}
              keywordInfo={keywordInfo}
              audioEl={null}
            />
          )}
        </p>
        <AudioPlayer
          contentId={item.id}
          size="sm"
          speaker={currentVoice.id}
          onReady={handleAudioReady}
          onEnded={handleAudioEnded}
        />
      </div>

      {/* ── Keyword chip + IPA ── */}
      <div className="px-5 pt-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-[#E6E4DA] px-3.5 py-1.5">
          <span className="text-sm font-bold text-[#2B2B2B]">{mainKw.word}</span>
          {mainKw.ipa && (
            <span className="text-xs font-mono text-[#4A7C59]">{mainKw.ipa}</span>
          )}
          <span className="text-sm text-[#6B6B6B]">{mainKw.meaning}</span>
          {mainKw.partOfSpeech && (
            <span className="text-xs italic text-[#9B9B9B]">{mainKw.partOfSpeech}</span>
          )}
        </div>
      </div>

      {/* ── Support keywords ── */}
      {supportKws.length > 0 && showSupport && (
        <div className="px-5 pt-2.5 flex flex-wrap gap-1.5">
          {supportKws.map((kw, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-white border border-[#E6E4DA] px-3 py-1 text-xs"
            >
              <span className="font-medium text-[#2B2B2B]">{kw.word}</span>
              <span className="text-[#9B9B9B]">{kw.meaning}</span>
            </span>
          ))}
        </div>
      )}

      {/* ── Explanation ── */}
      <p className="px-5 pt-2 text-sm leading-relaxed text-[#6B6B6B]">
        {item.explanation}
      </p>

      {/* ── Divider + Feedback ── */}
      <div className="border-t border-[#E6E4DA] mt-3 px-5 py-3 flex items-center">
        <FeedbackButtons contentId={item.id} />
      </div>
    </article>
  );
}
