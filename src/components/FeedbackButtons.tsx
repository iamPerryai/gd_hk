"use client";

import { useState, useCallback } from "react";
import type { FeedbackType } from "@/types/content";

interface FeedbackButtonsProps {
  contentId: string;
}

const OPTIONS: { type: FeedbackType; icon: string; label: string }[] = [
  { type: "useful", icon: "👍", label: "有用" },
  { type: "normal", icon: "👌", label: "一般" },
  { type: "unnatural", icon: "🤔", label: "不地道" },
];

export default function FeedbackButtons({ contentId }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<FeedbackType | null>(null);

  const submit = useCallback(
    async (type: FeedbackType) => {
      if (submitted) return;
      setSubmitted(type);

      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId, feedbackType: type }),
        });
      } catch {
        // fail silently
      }
    },
    [contentId, submitted],
  );

  if (submitted) {
    return (
      <p className="text-xs text-text-tertiary">
        已反馈，多谢你！
      </p>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-text-tertiary mr-0.5">这句话：</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.type}
          onClick={() => submit(opt.type)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-secondary hover:bg-app-bg transition-colors active:scale-95"
        >
          <span>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
