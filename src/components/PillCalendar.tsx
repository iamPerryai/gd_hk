"use client";

import { useMemo } from "react";
import { getLastNDays, getCurrentStreak } from "@/lib/streak-tracker";

interface PillCalendarProps {
  /** Number of days to show */
  days?: number;
}

/** Map card count to intensity level (0–4) */
function intensityLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 7) return 2;
  if (count <= 12) return 3;
  return 4;
}

const intensityColors: Record<number, string> = {
  0: "bg-[#EEEDEA]",
  1: "bg-[#4A7C59]/20",
  2: "bg-[#4A7C59]/40",
  3: "bg-[#4A7C59]/65",
  4: "bg-[#4A7C59]",
};

export default function PillCalendar({ days = 14 }: PillCalendarProps) {
  const dayData = useMemo(() => getLastNDays(days), [days]);
  const streak = useMemo(() => getCurrentStreak(), []);

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#6B6B6B] tracking-wide">
          最近 {days} 天
        </span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#4A7C59]/10 rounded-full text-[10px] font-semibold text-[#4A7C59]">
            🔥 {streak} 天连续
          </span>
        )}
      </div>

      {/* Pill grid */}
      <div className="flex gap-1.5 flex-wrap">
        {dayData.map((day) => {
          const level = intensityLevel(day.count);
          return (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1 group relative"
              title={`${day.date}: ${day.count} 张卡片`}
            >
              {/* Pill bar */}
              <div
                className={`w-9 h-8 rounded-lg transition-all duration-300 ${
                  intensityColors[level]
                } ${
                  day.isToday
                    ? "ring-2 ring-[#4A7C59]/40 ring-offset-1 ring-offset-white"
                    : ""
                }`}
              />
              {/* Day label */}
              <span
                className={`text-[10px] font-medium tabular-nums ${
                  day.isToday ? "text-[#4A7C59]" : "text-[#C9C8C2]"
                }`}
              >
                {day.label}
              </span>
              {/* Tooltip on hover */}
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#2B2B2B] text-white text-[10px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {day.date} · {day.count} 卡
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-[#C9C8C2]">少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`w-3 h-3 rounded-sm ${intensityColors[level]}`}
          />
        ))}
        <span className="text-[10px] text-[#C9C8C2]">多</span>
      </div>
    </div>
  );
}
