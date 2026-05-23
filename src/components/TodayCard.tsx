"use client";

import { useState, useCallback } from "react";
import AudioPlayer from "./AudioPlayer";
import FeedbackButtons from "./FeedbackButtons";
import SyncedText, { collectKeywords, buildKeywordInfo } from "./SyncedText";
import type { ContentListItem } from "@/types/content";
import type { TimestampEntry } from "@/lib/volcengine-tts";

export default function TodayCard({ item }: { item: ContentListItem }) {
  const [showSupport, setShowSupport] = useState(false);
  const [syncedAudio, setSyncedAudio] = useState<HTMLAudioElement | null>(null);
  const [timestamps, setTimestamps] = useState<TimestampEntry[] | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mainKw = item.mainKeyword as {
    word: string; meaning: string; example?: string; ipa?: string; partOfSpeech?: string;
  };
  const supportKws = item.supportKeywords as Array<{ word: string; meaning: string }>;
  const allKeywords = collectKeywords(item.mainKeyword, item.supportKeywords);
  const keywordInfo = buildKeywordInfo(item.mainKeyword, item.supportKeywords);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleAudioReady = useCallback(
    (audioEl: HTMLAudioElement, ts: TimestampEntry[]) => {
      const prevCleanup = (audioEl as any).__todayCleanup;
      if (prevCleanup) prevCleanup();

      setSyncedAudio(audioEl);
      setTimestamps(ts);
      setDuration(audioEl.duration || 0);
      setIsPlaying(!audioEl.paused);
      setCurrentTime(audioEl.currentTime);

      const onTime = () => setCurrentTime(audioEl.currentTime);
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onEnd = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audioEl.addEventListener("timeupdate", onTime);
      audioEl.addEventListener("play", onPlay);
      audioEl.addEventListener("pause", onPause);
      audioEl.addEventListener("ended", onEnd);

      (audioEl as any).__todayCleanup = () => {
        audioEl.removeEventListener("timeupdate", onTime);
        audioEl.removeEventListener("play", onPlay);
        audioEl.removeEventListener("pause", onPause);
        audioEl.removeEventListener("ended", onEnd);
      };
    },
    [],
  );

  const handleAudioEnded = useCallback(() => {
    setSyncedAudio(null);
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleReplay = useCallback(() => {
    if (syncedAudio) {
      syncedAudio.currentTime = 0;
      syncedAudio.play().catch(console.error);
    }
  }, [syncedAudio]);

  return (
    <section className="mt-4 sm:mt-6 bg-[#F7F6F0] border border-[#E6E4DA] rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col min-h-[calc(100vh-180px)]">
      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-8 py-3.5 border-b border-[#E6E4DA] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 bg-[#4A7C59]/10 text-[#4A7C59] text-xs font-semibold rounded-full tracking-wide">
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
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-300 text-[#6B6B6B] border-[#D9D8D2] hover:bg-[#EEEDEA] hover:border-[#C9C8C2]"
          >
            辅助词汇 ({supportKws.length})
            <svg
              className={`w-3 h-3 transition ${showSupport ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Hook line ── */}
      {item.hookText && (
        <div className="px-6 sm:px-12 pt-6 sm:pt-8 pb-1 flex-shrink-0">
          <p className="text-sm sm:text-base text-[#8E8E8E] leading-relaxed">
            {item.hookText}
          </p>
        </div>
      )}

      {/* ── Sentence — large serif, fills available space ── */}
      <div className="px-5 sm:px-10 py-6 sm:py-10 flex-1 flex items-center justify-center">
        <p className="text-2xl sm:text-3xl md:text-4xl text-[#2B2B2B] font-serif leading-[2.2] sm:leading-[2.5] tracking-wide text-center max-w-3xl">
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
      </div>

      {/* ── Audio Player Bar ── */}
      <div className="mx-4 sm:mx-8 mb-4 bg-white/70 backdrop-blur-sm border border-[#E6E4DA] rounded-2xl p-4 sm:p-5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <AudioPlayer
            contentId={item.id}
            onReady={handleAudioReady}
            onEnded={handleAudioEnded}
          />

          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs font-mono text-[#9B9B9B] w-12 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-2 bg-[#E6E4DA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4A7C59] rounded-full transition-all duration-100 ease-linear"
                style={{
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
            </div>
            <span className="text-xs font-mono text-[#9B9B9B] w-12 tabular-nums">
              {duration > 0 ? formatTime(duration) : "--:--"}
            </span>
          </div>

          {/* Replay button */}
          {isPlaying && (
            <button
              onClick={handleReplay}
              className="flex-shrink-0 p-2 text-[#9B9B9B] hover:text-[#4A4A4A] hover:bg-[#F0EFE9] rounded-xl transition-all duration-200"
              aria-label="重播"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Keyword Card ── */}
      <div className="mx-4 sm:mx-8 mb-4 rounded-2xl bg-white/50 border border-[#E6E4DA]/60 p-5 sm:p-6 flex-shrink-0">
        <div className="flex items-baseline gap-2 mb-1">
          {mainKw.ipa && (
            <span className="text-base font-mono text-[#4A7C59]">{mainKw.ipa}</span>
          )}
          {mainKw.partOfSpeech && (
            <span className="text-xs italic text-[#9B9B9B]">{mainKw.partOfSpeech}</span>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-[#2B2B2B]">{mainKw.word}</p>
        <p className="mt-1 text-sm sm:text-base text-[#6B6B6B]">{mainKw.meaning}</p>
        {mainKw.example && (
          <p className="mt-3 text-sm sm:text-base text-[#7B7B7B] italic border-l-2 border-[#4A7C59]/30 pl-3">
            {mainKw.example}
          </p>
        )}
      </div>

      {/* ── Support Keywords ── */}
      {supportKws.length > 0 && showSupport && (
        <div className="mx-4 sm:mx-8 mb-4 flex flex-wrap gap-2 flex-shrink-0">
          {supportKws.map((kw, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#E6E4DA] px-3 py-1.5 text-sm"
            >
              <span className="font-semibold text-[#2B2B2B]">{kw.word}</span>
              <span className="text-[#9B9B9B] text-xs">{kw.meaning}</span>
            </span>
          ))}
        </div>
      )}

      {/* ── Explanation ── */}
      <div className="mx-4 sm:mx-8 mb-4 flex-shrink-0">
        <p className="text-sm sm:text-base leading-relaxed text-[#6B6B6B]">
          {item.explanation}
        </p>
      </div>

      {/* ── Divider + Feedback ── */}
      <div className="border-t border-[#E6E4DA] px-4 sm:px-8 py-4 flex items-center flex-shrink-0">
        <FeedbackButtons contentId={item.id} />
      </div>
    </section>
  );
}
