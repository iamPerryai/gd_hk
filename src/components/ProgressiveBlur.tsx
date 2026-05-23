"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";

interface ProgressiveBlurProps {
  children: ReactNode;
  /** Max height in pixels before blurring */
  maxHeight?: number;
  /** Label for expand button */
  expandLabel?: string;
  /** Label for collapse button */
  collapseLabel?: string;
  className?: string;
}

export default function ProgressiveBlur({
  children,
  maxHeight = 120,
  expandLabel = "展开全文",
  collapseLabel = "收起",
  className = "",
}: ProgressiveBlurProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const checkOverflow = useCallback(() => {
    const el = contentRef.current;
    if (el) {
      setOverflow(el.scrollHeight > maxHeight + 10); // 10px tolerance
    }
  }, [maxHeight]);

  useEffect(() => {
    checkOverflow();
    // Re-check on resize
    const onResize = () => checkOverflow();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [checkOverflow]);

  const toggle = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  return (
    <div className={className}>
      {/* Content wrapper */}
      <div className="relative">
        <div
          ref={contentRef}
          className="overflow-hidden transition-all duration-500 ease-out"
          style={{
            maxHeight: expanded ? `${contentRef.current?.scrollHeight || 2000}px` : `${maxHeight}px`,
          }}
        >
          {children}
        </div>

        {/* Gradient fade overlay — only when collapsed and overflowing */}
        {!expanded && overflow && (
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: `${Math.min(60, maxHeight * 0.5)}px`,
              background: "linear-gradient(to bottom, transparent 0%, #F7F6F0 85%)",
            }}
          />
        )}
      </div>

      {/* Toggle button */}
      {overflow && (
        <button
          onClick={toggle}
          className="mt-2 text-xs font-medium text-[#4A7C59] hover:text-[#3D6B4B] transition-colors flex items-center gap-1 mx-auto"
        >
          {expanded ? collapseLabel : expandLabel}
          <svg
            className={`w-3 h-3 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
