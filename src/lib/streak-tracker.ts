"use client";

const STREAK_KEY = "hk-study-streak";
const CARDS_KEY = "hk-daily-cards";

interface StreakData {
  /** ISO date strings (YYYY-MM-DD) of days studied */
  days: string[];
  /** Cards reviewed per day: { "YYYY-MM-DD": count } */
  cardsPerDay: Record<string, number>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { days: [], cardsPerDay: {} };
}

function writeStreak(data: StreakData): void {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/** Call once per day when user views a card — marks today and increments count */
export function recordStudyDay(): StreakData {
  const data = readStreak();
  const d = today();

  if (!data.days.includes(d)) {
    data.days.push(d);
    // Keep last 90 days only
    if (data.days.length > 90) {
      data.days = data.days.slice(-90);
    }
  }

  data.cardsPerDay[d] = (data.cardsPerDay[d] || 0) + 1;
  writeStreak(data);
  return data;
}

/** Get current streak data */
export function getStreakData(): StreakData {
  return readStreak();
}

/** Get current consecutive-day streak */
export function getCurrentStreak(): number {
  const { days } = readStreak();
  if (days.length === 0) return 0;

  const sorted = [...days].sort().reverse();
  const todayStr = today();
  let count = 0;

  // Check if studied today
  if (sorted[0] !== todayStr) {
    // Streak broken if last study was not today and not yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (sorted[0] !== yesterdayStr) return 0;
  }

  // Count consecutive days
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (sorted.includes(expectedStr)) {
      count++;
    } else if (i > 0) {
      break;
    }
  }

  return count;
}

/** Get today's card count */
export function getTodayCardCount(): number {
  const { cardsPerDay } = readStreak();
  return cardsPerDay[today()] || 0;
}

/** Generate last N days for calendar display */
export function getLastNDays(n: number): Array<{
  date: string;
  label: string;
  count: number;
  isToday: boolean;
}> {
  const { cardsPerDay } = readStreak();
  const result: Array<{ date: string; label: string; count: number; isToday: boolean }> = [];

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay(); // 0=Sun
    const label = ["日", "一", "二", "三", "四", "五", "六"][dayOfWeek];

    result.push({
      date: dateStr,
      label,
      count: cardsPerDay[dateStr] || 0,
      isToday: i === 0,
    });
  }

  return result;
}
