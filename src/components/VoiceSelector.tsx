"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useVoice } from "@/lib/voice-context";

export default function VoiceSelector() {
  const { voices, currentVoice, setVoice } = useVoice();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Memoized case-insensitive search (M23 fix)
  const filtered = useMemo(() => {
    if (!search) return voices;
    const q = search.toLowerCase();
    return voices.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q),
    );
  }, [voices, search]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 text-[#6B6B6B] border-[#D9D8D2] hover:bg-[#EEEDEA] hover:border-[#C9C8C2]"
        title={`当前音色: ${currentVoice.name}`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
        {currentVoice.name}
        <svg
          className={`w-3 h-3 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 max-h-80 bg-white border border-[#E6E4DA] rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[#E6E4DA]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索音色..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E6E4DA] bg-[#FAFAF5] text-[#2B2B2B] placeholder:text-[#C9C8C2] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-60">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-[#C9C8C2] py-6">无匹配音色</p>
            ) : (
              filtered.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => {
                    setVoice(voice);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F7F6F0] transition-colors flex items-center justify-between gap-3 ${
                    voice.id === currentVoice.id ? "bg-[#4A7C59]/5" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[#2B2B2B] truncate">
                      {voice.name}
                      {voice.id === currentVoice.id && (
                        <span className="ml-1.5 text-[10px] text-[#4A7C59] align-middle">
                          ✓ 当前
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#9B9B9B] truncate">
                      {voice.description}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
