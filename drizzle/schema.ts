import { pgTable, uuid, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const contents = pgTable("contents", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentNo: text("content_no").unique().notNull(),
  scene: text("scene").notNull(),
  hookText: text("hook_text"),
  cantoneseText: text("cantonese_text").notNull(),
  explanation: text("explanation").notNull(),
  mainKeyword: jsonb("main_keyword").notNull(),
  supportKeywords: jsonb("support_keywords").notNull().default("[]"),
  segments: jsonb("segments"),
  tags: jsonb("tags").notNull().default("[]"),
  audioUrl: text("audio_url"),
  audioStatus: text("audio_status").notNull().default("pending"),
  sourceType: text("source_type").notNull().default("kimi"),
  reviewStatus: text("review_status").notNull().default("draft"),
  isToday: boolean("is_today").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentId: uuid("content_id").references(() => contents.id, { onDelete: "cascade" }),
  feedbackType: text("feedback_type").notNull(),
  anonymousId: text("anonymous_id"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventName: text("event_name").notNull(),
  contentId: uuid("content_id").references(() => contents.id, { onDelete: "set null" }),
  scene: text("scene"),
  anonymousId: text("anonymous_id"),
  metadata: jsonb("metadata").notNull().default("{}"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
