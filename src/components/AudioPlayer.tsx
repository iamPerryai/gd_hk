"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { TimestampEntry } from "@/lib/volcengine-tts";

interface AudioPlayerProps {
  contentId: string;
  size?: "sm" | "md";
  speaker?: string;
  /** Callback when audio is loaded with timestamps for synced text */
  onReady?: (audioEl: HTMLAudioElement, timestamps: TimestampEntry[]) => void;
  /** Callback when playback ends */
  onEnded?: () => void;
}

export default function AudioPlayer({
  contentId,
  size = "md",
  speaker,
  onReady,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "playing">("idle");
  const timestampsRef = useRef<TimestampEntry[] | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const pendingPlayRef = useRef(false);

  // Preload audio + timestamps on mount so play() can be called
  // synchronously in the click handler (required by browser autoplay policy).
  useEffect(() => {
    let cancelled = false;

    async function preload() {
      try {
        setStatus("loading");

        const url = speaker
          ? `/api/audio/${contentId}?speaker=${encodeURIComponent(speaker)}`
          : `/api/audio/${contentId}`;
        const resp = await fetch(url);
        if (!resp.ok || cancelled) {
          if (!cancelled) setStatus("idle");
          return;
        }

        // Parse timestamps from response header (base64-encoded UTF-8 JSON)
        const tsHeader = resp.headers.get("X-Timestamps");
        if (tsHeader) {
          try {
            const binary = atob(tsHeader);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const tsJson = new TextDecoder("utf-8").decode(bytes);
            timestampsRef.current = JSON.parse(tsJson);
          } catch {
            timestampsRef.current = null;
          }
        }

        // Create blob URL for instant playback later
        const blob = await resp.blob();
        if (cancelled) return;

        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = URL.createObjectURL(blob);

        // Pre-warm the audio element so playback starts instantly on click
        const audio = audioRef.current;
        if (audio) {
          audio.src = blobUrlRef.current;
          audio.load();
        }

        setStatus("idle");

        // If user clicked play while still loading, auto-play now
        if (pendingPlayRef.current && audio) {
          pendingPlayRef.current = false;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setStatus("playing");
                if (onReady && timestampsRef.current) {
                  onReady(audio, timestampsRef.current);
                }
              })
              .catch((err) => {
                console.error("Audio play error:", err);
                setStatus("idle");
              });
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Audio preload error:", err);
          setStatus("idle");
        }
      }
    }

    preload();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      timestampsRef.current = null;
    };
  }, [contentId, speaker]);

  // Click handler: everything synchronous so browser sees a user gesture
  const handleClick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // If already playing, restart from beginning
    if (status === "playing") {
      audio.currentTime = 0;
      audio.play().catch((err) => console.error("Replay error:", err));
      return;
    }

    // Not preloaded yet — flag pending play, preload effect will auto-play
    if (!blobUrlRef.current) {
      setStatus("loading");
      pendingPlayRef.current = true;
      return;
    }

    // Ensure audio element has the blob URL set (may already be set by preload)
    if (audio.src !== blobUrlRef.current) {
      audio.src = blobUrlRef.current;
      audio.load();
    }

    // Synchronous play() — browser sees this as user-initiated
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setStatus("playing");
          // Notify parent AFTER play starts (avoids re-render interrupting playback)
          if (onReady && timestampsRef.current) {
            onReady(audio, timestampsRef.current);
          }
        })
        .catch((err) => {
          console.error("Audio play error:", err);
          setStatus("idle");
        });
    }
  }, [contentId, status, onReady]);

  const handleEnded = useCallback(() => {
    setStatus("idle");
    onEnded?.();
  }, [onEnded]);

  const isSmall = size === "sm";

  return (
    <span className="inline-flex items-center">
      <button
        onClick={handleClick}
        disabled={status === "loading" && !blobUrlRef.current}
        className={`group relative flex items-center justify-center rounded-full transition-all
          ${isSmall ? "w-8 h-8" : "w-11 h-11"}
          ${
            status === "playing"
              ? "bg-accent/10 text-accent"
              : status === "loading"
                ? "bg-accent/5 text-accent/40 cursor-wait"
                : "bg-accent text-white hover:bg-accent/90 active:scale-95 shadow-sm shadow-accent/25"
          }`}
        aria-label={
          status === "playing" ? "重播" : status === "loading" ? "加载中" : "播放"
        }
      >
        {status === "loading" ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : status === "playing" ? (
          <svg className={isSmall ? "w-3.5 h-3.5" : "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className={isSmall ? "w-3.5 h-3.5 ml-0.5" : "w-5 h-5 ml-0.5"} viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        {status === "playing" && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-accent" />
        )}
      </button>
      <audio ref={audioRef} onEnded={handleEnded} preload="auto" />
    </span>
  );
}
