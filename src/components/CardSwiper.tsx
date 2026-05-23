"use client";

import { useState, useRef, useCallback, type PointerEvent as ReactPointerEvent } from "react";
import ContentCard from "./ContentCard";
import type { ContentListItem } from "@/types/content";

/** How many page dots to show at most before collapsing with ellipsis */
const MAX_VISIBLE_DOTS = 7;

export default function CardSwiper({ items }: { items: ContentListItem[] }) {
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const total = items.length;

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= total || animating) return;
      setAnimating(true);
      const dir = next > index ? 1 : -1;
      setOffsetX(dir * -120);
      setTimeout(() => {
        setIndex(next);
        setOffsetX(dir * 80);
        setTimeout(() => {
          setOffsetX(0);
          setTimeout(() => setAnimating(false), 200);
        }, 50);
      }, 150);
    },
    [index, total, animating],
  );

  // ── Pointer / swipe handlers ──
  const handlePointerDown = (e: ReactPointerEvent) => {
    if (animating) return;
    setDragging(true);
    startX.current = e.clientX;
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    if ((index === 0 && dx > 0) || (index === total - 1 && dx < 0)) {
      setOffsetX(dx * 0.3);
    } else {
      setOffsetX(dx);
    }
  };

  const handlePointerUp = (e: ReactPointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);

    const dx = e.clientX - startX.current;
    const threshold = 60;

    if (dx < -threshold && index < total - 1) {
      goTo(index + 1);
    } else if (dx > threshold && index > 0) {
      goTo(index - 1);
    } else {
      setOffsetX(0);
    }
  };

  // ── Dot logic: collapse long lists ──
  const showAllDots = total <= MAX_VISIBLE_DOTS;
  const dots = showAllDots
    ? Array.from({ length: total }, (_, i) => i)
    : collapsedDots(total, index);

  const currentItem = items[index];

  return (
    <div className="mt-4" ref={containerRef}>
      {/* Card container with swipe */}
      <div
        className="touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        {/* Min-height prevents layout jump when switching between cards of different content length */}
        <div
          className="transition-transform duration-200 ease-out min-h-[280px]"
          style={{
            transform: `translateX(${offsetX}px)`,
            opacity: animating ? 0.85 : 1,
            transition: dragging ? "none" : "transform 0.2s ease-out, opacity 0.15s ease-out",
          }}
        >
          <ContentCard item={currentItem} />
        </div>
      </div>

      {/* Navigation row: arrows + dots + counter */}
      <div className="mt-5 flex items-center justify-center gap-3">
        {/* Left arrow — 44px touch target */}
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0 || animating}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-[#D9D8D2] text-[#6B6B6B] hover:bg-[#EEEDEA] hover:text-[#2B2B2B] hover:border-[#C9C8C2] disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
          aria-label="上一张"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Dot indicators — use flex-1 to center naturally */}
        <div className="flex items-center gap-2 px-2">
          {dots.map((dot, i) =>
            dot === "ellipsis" ? (
              <span key={`e-${i}`} className="w-1.5 h-1.5 rounded-full bg-[#D9D8D2]" />
            ) : (
              <button
                key={dot}
                onClick={() => {
                  if (dot !== index && !animating) {
                    setAnimating(true);
                    setOffsetX(dot > index ? -80 : 80);
                    setTimeout(() => {
                      setIndex(dot);
                      setOffsetX(0);
                      setTimeout(() => setAnimating(false), 200);
                    }, 120);
                  }
                }}
                className={`rounded-full transition-all duration-300 ${
                  dot === index
                    ? "w-5 h-2.5 bg-[#4A7C59]"
                    : "w-2.5 h-2.5 bg-[#D9D8D2] hover:bg-[#9B9B9B]"
                }`}
                aria-label={`第 ${dot + 1} 张`}
              />
            ),
          )}
        </div>

        {/* Right arrow — 44px touch target */}
        <button
          onClick={() => goTo(index + 1)}
          disabled={index === total - 1 || animating}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-[#D9D8D2] text-[#6B6B6B] hover:bg-[#EEEDEA] hover:text-[#2B2B2B] hover:border-[#C9C8C2] disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
          aria-label="下一张"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Progress counter */}
      <p className="mt-2 text-center text-[11px] font-mono text-[#9B9B9B]">
        {index + 1} / {total}
      </p>
    </div>
  );
}

/** Return dot array for collapsed mode: first, last, current±1, and ellipsis gaps */
function collapsedDots(total: number, current: number): Array<number | "ellipsis"> {
  const dots: Array<number | "ellipsis"> = [];

  // Always show first
  dots.push(0);

  // Left ellipsis?
  if (current > 2) dots.push("ellipsis");

  // Current neighborhood
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  for (let i = start; i <= end; i++) {
    dots.push(i);
  }

  // Right ellipsis?
  if (current < total - 3) dots.push("ellipsis");

  // Always show last
  if (total > 1) dots.push(total - 1);

  return dots;
}
