"use client";

import { useEffect, useState, useMemo } from "react";
import CircularProgress from "./CircularProgress";
import PillCalendar from "./PillCalendar";
import GlassCard from "./GlassCard";
import { recordStudyDay, getCurrentStreak, getTodayCardCount, getStreakData } from "@/lib/streak-tracker";

export default function ProgressDashboard() {
  const [mounted, setMounted] = useState(false);

  // Record today's study when component mounts
  useEffect(() => {
    recordStudyDay();
    setMounted(true);
  }, []);

  const streak = useMemo(() => (mounted ? getCurrentStreak() : 0), [mounted]);
  const todayCount = useMemo(() => (mounted ? getTodayCardCount() : 0), [mounted]);
  const totalDays = useMemo(() => {
    if (!mounted) return 0;
    const { days } = getStreakData();
    return days.length;
  }, [mounted]);

  if (!mounted) {
    // Skeleton while client-side data loads
    return (
      <GlassCard padded="md" accent>
        <div className="flex items-center justify-between gap-6 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#E6E4DA]" />
            <div className="w-20 h-20 rounded-full bg-[#E6E4DA]" />
          </div>
          <div className="flex-1 h-16 bg-[#E6E4DA] rounded-xl" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padded="md" accent hoverable>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Circular stats */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <CircularProgress
            value={streak > 0 ? Math.min(100, streak * 14.3) : 0}
            centerText={`${streak}`}
            label="连续天数"
            color="text-[#4A7C59]"
          />
          <CircularProgress
            value={todayCount > 0 ? Math.min(100, todayCount * 10) : 0}
            centerText={`${todayCount}`}
            label="今日卡片"
            color="text-[#D4A853]"
          />
        </div>

        {/* Pill calendar */}
        <div className="flex-1 min-w-0">
          <PillCalendar days={14} />
        </div>
      </div>
    </GlassCard>
  );
}
