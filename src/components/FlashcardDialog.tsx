"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Dialog } from "./ui/dialog";

export interface FlashcardItem {
  word: string;
  meaning: string;
  ipa?: string;
  partOfSpeech?: string;
  example?: string;
}

interface FlashcardDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  cards: FlashcardItem[];
  /** 0-indexed start card */
  startIndex?: number;
}

export default function FlashcardDialog({
  open,
  onClose,
  title,
  cards,
  startIndex = 0,
}: FlashcardDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [flipped, setFlipped] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(startIndex);
      setFlipped(false);
    }
  }, [open, startIndex]);

  const goTo = useCallback(
    (idx: number) => {
      setFlipped(false);
      setCurrentIndex(idx);
    },
    [],
  );

  // M26 fix: use refs so prev/next have stable identities — keyboard effect won't rebind on navigation
  const cardsLenRef = useRef(cards.length);
  cardsLenRef.current = cards.length;

  const prev = useCallback(() => {
    setFlipped(false);
    setCurrentIndex((i) => (i > 0 ? i - 1 : cardsLenRef.current - 1));
  }, []);

  const next = useCallback(() => {
    setFlipped(false);
    setCurrentIndex((i) => (i < cardsLenRef.current - 1 ? i + 1 : 0));
  }, []);

  const toggleFlip = useCallback(() => {
    setFlipped((v) => !v);
  }, []);

  // Keyboard: left/right arrows to navigate, space/flip to flip, escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleFlip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, prev, next, toggleFlip]);

  const card = cards[currentIndex];
  if (!card) return null;

  return (
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      {/* Title + counter */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#2B2B2B]">{title}</h2>
        <span className="text-xs font-mono text-[#C9C8C2] tabular-nums">
          {currentIndex + 1}/{cards.length}
        </span>
      </div>

      {/* ── 3D Flip Card ── */}
      <div
        className="relative w-full cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        onClick={toggleFlip}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "点击翻回正面" : "点击翻到背面"}
      >
        <div
          className="relative w-full aspect-[4/3] transition-transform duration-500 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ── Front face ── */}
          <div
            className="absolute inset-0 rounded-2xl bg-white border-2 border-[#E6E4DA] flex flex-col items-center justify-center p-6"
            style={{ backfaceVisibility: "hidden" }}
          >
            {card.ipa && (
              <span className="text-sm font-mono text-[#4A7C59] mb-2">{card.ipa}</span>
            )}
            <p className="text-3xl sm:text-4xl font-bold text-[#2B2B2B] font-serif text-center leading-tight">
              {card.word}
            </p>
            {card.partOfSpeech && (
              <span className="mt-2 text-xs italic text-[#9B9B9B]">{card.partOfSpeech}</span>
            )}
            <span className="mt-4 text-[10px] text-[#C9C8C2] tracking-widest uppercase">
              点击翻转
            </span>
          </div>

          {/* ── Back face ── */}
          <div
            className="absolute inset-0 rounded-2xl bg-[#4A7C59]/5 border-2 border-[#4A7C59]/20 flex flex-col items-center justify-center p-6"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-lg sm:text-xl font-semibold text-[#2B2B2B] text-center leading-relaxed">
              {card.meaning}
            </p>
            {card.example && (
              <p className="mt-3 text-sm text-[#7B7B7B] italic text-center leading-relaxed border-t border-[#4A7C59]/20 pt-3">
                {card.example}
              </p>
            )}
            <span className="mt-4 text-[10px] text-[#C9C8C2] tracking-widest uppercase">
              点击翻转
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E6E4DA] text-[#6B6B6B] hover:text-[#2B2B2B] hover:border-[#C9C8C2] transition-all"
          aria-label="上一张"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); toggleFlip(); }}
          className="px-4 py-2 text-sm font-medium text-[#4A7C59] bg-[#4A7C59]/10 hover:bg-[#4A7C59]/20 rounded-xl transition-all"
        >
          {flipped ? "翻回正面" : "翻转查看"}
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-[#4A7C59] w-3.5"
                  : "bg-[#E6E4DA] hover:bg-[#C9C8C2]"
              }`}
              aria-label={`第 ${i + 1} 张卡片`}
            />
          ))}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E6E4DA] text-[#6B6B6B] hover:text-[#2B2B2B] hover:border-[#C9C8C2] transition-all"
          aria-label="下一张"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints */}
      <p className="mt-3 text-center text-[10px] text-[#C9C8C2]">
        ← → 切换卡片 &nbsp;|&nbsp; 空格键 翻转 &nbsp;|&nbsp; Esc 关闭
      </p>
    </Dialog>
  );
}
