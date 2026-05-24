"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import AudioPlayer from "./AudioPlayer";
import WaveformPlayer from "./WaveformPlayer";
import FeedbackButtons from "./FeedbackButtons";
import SyncedText, { collectKeywords, buildKeywordInfo } from "./SyncedText";
import VoiceSelector from "./VoiceSelector";
import FlashcardDialog, { type FlashcardItem } from "./FlashcardDialog";
import ProgressiveBlur from "./ProgressiveBlur";
import { useVoice } from "@/lib/voice-context";
import { incrementUsage } from "@/lib/usage-tracker";
import type { ContentListItem } from "@/types/content";
import type { TimestampEntry } from "@/lib/volcengine-tts";

export default function TodayCard({
  items,
  startIndex,
}: {
  items: ContentListItem[];
  startIndex: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [showSupport, setShowSupport] = useState(false);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [syncedAudio, setSyncedAudio] = useState<HTMLAudioElement | null>(null);
  const [timestamps, setTimestamps] = useState<TimestampEntry[] | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { currentVoice } = useVoice();

  const item = items[currentIndex];
  if (!item) return null;

  const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
  const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;

  const goTo = useCallback(
    (idx: number) => {
      // Stop any playing audio
      if (syncedAudio) {
        syncedAudio.pause();
        syncedAudio.currentTime = 0;
      }
      setSyncedAudio(null);
      setTimestamps(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setShowSupport(false);
      setCurrentIndex(idx);
      // Track usage for soft login prompt
      incrementUsage();
    },
    [syncedAudio],
  );

  const mainKw = item.mainKeyword as {
    word: string; meaning: string; example?: string; ipa?: string; partOfSpeech?: string;
  };
  const supportKws = item.supportKeywords as Array<{ word: string; meaning: string }>;

  // Memoize computed values to avoid recalculation on audio time updates (M25 fix)
  const allKeywords = useMemo(
    () => collectKeywords(item.mainKeyword, item.supportKeywords),
    [item.mainKeyword, item.supportKeywords],
  );
  const keywordInfo = useMemo(
    () => buildKeywordInfo(item.mainKeyword, item.supportKeywords),
    [item.mainKeyword, item.supportKeywords],
  );
  const flashcardDeck: FlashcardItem[] = useMemo(
    () => [
      { word: mainKw.word, meaning: mainKw.meaning, ipa: mainKw.ipa, partOfSpeech: mainKw.partOfSpeech, example: mainKw.example },
      ...supportKws.map((kw) => ({ word: kw.word, meaning: kw.meaning })),
    ],
    [mainKw.word, mainKw.meaning, mainKw.ipa, mainKw.partOfSpeech, mainKw.example, supportKws],
  );

  const handleAudioReady = useCallback(
    (audioEl: HTMLAudioElement, ts: TimestampEntry[]) => {
      setSyncedAudio(audioEl);
      setTimestamps(ts);
      setDuration(audioEl.duration || 0);
      setIsPlaying(!audioEl.paused);
      setCurrentTime(audioEl.currentTime);
      // Track usage for soft login prompt
      incrementUsage();
    },
    [],
  );

  // H11 fix: use proper useEffect for event listeners instead of __todayCleanup
  useEffect(() => {
    const audio = syncedAudio;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
    };
  }, [syncedAudio]);

  const handleAudioEnded = useCallback(() => {
    setSyncedAudio(null);
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!syncedAudio) return;
    if (syncedAudio.paused) {
      syncedAudio.play().catch(console.error);
    } else {
      syncedAudio.pause();
    }
  }, [syncedAudio]);

  const handleSeek = useCallback(
    (fraction: number) => {
      if (syncedAudio && duration > 0) {
        syncedAudio.currentTime = fraction * duration;
      }
    },
    [syncedAudio, duration],
  );

  const handleReplay = useCallback(() => {
    if (syncedAudio) {
      syncedAudio.currentTime = 0;
      syncedAudio.play().catch(console.error);
    }
  }, [syncedAudio]);

  return (
    <div className="relative mt-4 sm:mt-6">
      {/* ── Left / Right navigation arrows ── */}
      <button
        onClick={() => goTo(prevIndex)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-[#E6E4DA] text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-white hover:border-[#C9C8C2] shadow-sm hover:shadow-md transition-all duration-200 -ml-3 sm:-ml-5"
        aria-label="上一个"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        onClick={() => goTo(nextIndex)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-[#E6E4DA] text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-white hover:border-[#C9C8C2] shadow-sm hover:shadow-md transition-all duration-200 -mr-3 sm:-mr-5"
        aria-label="下一个"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <section
        key={item.id}
        className="bg-[#F7F6F0] border border-[#E6E4DA] rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col min-h-[calc(100vh-180px)] animate-in fade-in duration-200"
      >
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
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#C9C8C2] tabular-nums">
              {currentIndex + 1}/{items.length}
            </span>
            <VoiceSelector />
            <button
              onClick={() => setShowFlashcard(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all duration-300 text-[#4A7C59] border-[#4A7C59]/30 hover:bg-[#4A7C59]/10 hover:border-[#4A7C59]/50"
              aria-label="闪卡模式"
              title="闪卡模式 — 翻卡背单词"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="4" width="8" height="10" rx="1" />
                <rect x="14" y="4" width="8" height="10" rx="1" />
                <path d="M6 14l4 6M18 14l-4 6" />
              </svg>
              闪卡
            </button>
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
          <AudioPlayer
            contentId={item.id}
            speaker={currentVoice.id}
            hideButton
            onReady={handleAudioReady}
            onEnded={handleAudioEnded}
          />
          <WaveformPlayer
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onReplay={handleReplay}
          />
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
          <ProgressiveBlur maxHeight={120}>
            <p className="text-sm sm:text-base leading-relaxed text-[#6B6B6B]">
              {item.explanation}
            </p>
          </ProgressiveBlur>
        </div>

        {/* ── Divider + Feedback ── */}
        <div className="border-t border-[#E6E4DA] px-4 sm:px-8 py-4 flex items-center flex-shrink-0">
          <FeedbackButtons contentId={item.id} />
        </div>
      </section>

      {/* ── Flashcard Dialog ── */}
      <FlashcardDialog
        open={showFlashcard}
        onClose={() => setShowFlashcard(false)}
        title={`${item.scene} · 词汇闪卡`}
        cards={flashcardDeck}
      />
    </div>
  );
}
