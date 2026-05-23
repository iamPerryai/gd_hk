import { db } from "./db";
import { events } from "../../drizzle/schema";

export type EventName =
  | "audio_play"
  | "audio_complete"
  | "keyword_expand"
  | "feedback_click"
  | "scene_filter_click";

export async function recordEvent(input: {
  eventName: EventName;
  contentId?: string;
  scene?: string;
  anonymousId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(events).values({
    eventName: input.eventName,
    contentId: input.contentId || null,
    scene: input.scene || null,
    anonymousId: input.anonymousId || null,
    metadata: input.metadata || {},
  });
}
