import { db } from "./db";
import { events } from "../../drizzle/schema";

export type EventName =
  | "audio_play"
  | "audio_complete"
  | "keyword_expand"
  | "feedback_click"
  | "scene_filter_click";

type EventInput = {
  eventName: EventName;
  contentId?: string;
  scene?: string;
  anonymousId?: string;
  metadata?: Record<string, unknown>;
};

// Buffer events and flush in batches to reduce DB round-trips (H7 fix)
const FLUSH_INTERVAL_MS = 2000;
const MAX_BUFFER_SIZE = 50;

let buffer: Array<typeof events.$inferInsert> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushEvents() {
  const batch = buffer;
  buffer = [];
  flushTimer = null;

  if (batch.length === 0) return;

  try {
    await db.insert(events).values(batch);
  } catch (error) {
    console.error("Failed to flush analytics events:", error);
    // Drop events on failure — analytics should never break the app
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushEvents();
  }, FLUSH_INTERVAL_MS);
  // Allow Node.js to exit even if timer is pending
  if (flushTimer && typeof flushTimer === "object") {
    (flushTimer as ReturnType<typeof setTimeout>).unref?.();
  }
}

export async function recordEvent(input: EventInput) {
  try {
    buffer.push({
      eventName: input.eventName,
      contentId: input.contentId || null,
      scene: input.scene || null,
      anonymousId: input.anonymousId || null,
      metadata: input.metadata || {},
    });

    // Flush immediately if buffer is full
    if (buffer.length >= MAX_BUFFER_SIZE) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      // Fire-and-forget — don't await, don't block the caller
      flushEvents();
    } else {
      scheduleFlush();
    }
  } catch (error) {
    // Silently ignore — analytics should never propagate errors
    console.error("Analytics recordEvent error:", error);
  }
}
