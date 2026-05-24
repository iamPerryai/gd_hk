"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface WaveformPlayerProps {
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Called when user clicks play/pause */
  onPlayPause: () => void;
  /** Called when user seeks to a position (0-1) */
  onSeek: (fraction: number) => void;
  /** Called to replay from beginning */
  onReplay?: () => void;
}

/** Generate pseudo-random waveform bar heights that look natural */
function generateBars(count: number, seed: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    // Pseudo-random using sine for deterministic but natural look
    const base = Math.abs(Math.sin(i * 0.7 + seed * 0.3)) * 0.5 + 0.25;
    const variation = Math.abs(Math.sin(i * 1.3 + seed * 1.7)) * 0.3;
    const peak = Math.abs(Math.cos(i * 0.37 + seed * 0.91)) * 0.2;
    bars.push(Math.min(1, base + variation + peak * (i % 7 === 0 ? 1.5 : 1)));
  }
  return bars;
}

export default function WaveformPlayer({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  onReplay,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const barCount = 64;
  // Lazy-initialize bars on client only to avoid SSR/CSR floating-point mismatch
  const [bars, setBars] = useState<number[]>([]);
  useEffect(() => {
    setBars(generateBars(barCount, 42));
  }, []);

  const progress = duration > 0 ? currentTime / duration : 0;

  const getFractionFromEvent = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      onSeek(getFractionFromEvent(e.clientX));
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [onSeek, getFractionFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      onSeek(getFractionFromEvent(e.clientX));
    },
    [isDragging, onSeek, getFractionFromEvent]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full select-none">
      {/* Waveform + Controls Row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={onPlayPause}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white hover:bg-accent-dark active:scale-95 transition-all duration-200 shadow-sm shadow-accent/25"
          aria-label={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Time */}
        <span className="flex-shrink-0 text-xs font-mono text-text-tertiary w-10 text-right tabular-nums">
          {formatTime(currentTime)}
        </span>

        {/* Waveform */}
        <div
          ref={containerRef}
          className="relative flex-1 h-12 flex items-end gap-[2px] cursor-pointer group"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Bars */}
          {bars.map((height, i) => {
            const barProgress = i / barCount;
            const isPlayed = barProgress <= progress;
            // Calculate dynamic height: base height + playing animation
            const baseHeight = 4 + height * 36; // 4px min, 40px max

            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-75"
                style={{
                  height: `${baseHeight}px`,
                  backgroundColor: isPlayed ? "var(--color-accent)" : "var(--color-separator)",
                  opacity: isPlayed ? 0.9 : 0.5,
                }}
              />
            );
          })}

          {/* Playhead line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-accent rounded-full pointer-events-none shadow-sm"
            style={{ left: `${progress * 100}%` }}
          />

          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg ring-1 ring-accent/20" />
        </div>

        {/* Duration */}
        <span className="flex-shrink-0 text-xs font-mono text-text-tertiary w-10 tabular-nums">
          {duration > 0 ? formatTime(duration) : "--:--"}
        </span>

        {/* Replay */}
        {isPlaying && onReplay && (
          <button
            onClick={onReplay}
            className="flex-shrink-0 p-1.5 text-text-tertiary hover:text-accent hover:bg-accent/5 rounded-lg transition-all duration-200"
            aria-label="重播"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
