# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build (standalone output)
npm run lint             # ESLint
npm run db:generate      # Drizzle Kit — generate migrations from schema changes
npm run db:push          # Drizzle Kit — push schema directly to DB
npm run db:studio        # Drizzle Kit — open DB studio
npm run db:seed          # Seed database with content from scripts/seed-db.ts
npm run generate:content # Generate content via Kimi API (scripts/generate-content.ts)
npm run generate:audio   # Generate audio via Volcengine TTS (scripts/generate-audio.ts)
```

## Architecture

This is a **Cantonese-English workplace listening web app** — lightweight MVP with 30 curated audio cards across 6 workplace scenes. Users listen to Cantonese sentences with embedded English keywords, view word explanations, and give feedback.

### Stack

- **Framework**: Next.js 15 (App Router, standalone output, deployed on Vercel)
- **Database**: Neon PostgreSQL (serverless driver) + Drizzle ORM
- **Styling**: Tailwind CSS 4 + custom warm palette (米白/浅黄/浅橙/深灰)
- **Auth**: JWT (jose) with httpOnly cookies, bcryptjs password hashing, Cloudflare Turnstile
- **Content generation**: Kimi API (Moonshot) — generates Cantonese-English mixed workplace dialogues with inline `{word|IPA|meaning}` markup
- **TTS**: Volcengine (ByteDance) async TTS with word-level timestamps — audio generated on-demand via `/api/audio/[id]`

### Data flow

1. **Content lifecycle**: Kimi API generates drafts → admin approves (`reviewStatus: "published"`) → audio generated via Volcengine TTS (`audioStatus: "approved"`) → visible on site
2. **Home page** (`src/app/page.tsx`): Server component fetches published+approved contents from DB, passes to client components for interactivity
3. **Audio playback**: `AudioPlayer` component fetches `/api/audio/[id]?speaker=...`, which calls Volcengine TTS in real-time, returns MP3 with `X-Timestamps` header for word-level syncing
4. **Synced highlighting**: `SyncedText` component uses `requestAnimationFrame` loop to highlight words as audio plays, driven by TTS timestamps
5. **Feedback**: Client-side POSTs to `/api/feedback` and `/api/events` with anonymous IDs (cookie-based)

### Directory layout

```
src/
  app/
    page.tsx              # Home page (server component, fetches + filters content)
    layout.tsx            # Root layout (AuthProvider + VoiceProvider + ClientLayout)
    (auth)/               # Login/register pages
    api/
      contents/route.ts   # GET — list published contents, optional ?scene= filter
      contents/today/     # GET — today's featured content (isToday=true)
      feedback/route.ts   # POST — submit feedback (useful/normal/unnatural)
      events/route.ts     # POST — record analytics events
      audio/[id]/route.ts # GET — real-time TTS audio with timestamps
      auth/               # login, register, logout, me
      admin/generate-content/ # POST — Kimi content generation (auth-protected)
  lib/
    db.ts                 # Neon HTTP + Drizzle (lazy init via Proxy)
    auth.ts               # Password hashing, cookie management, getCurrentUser
    jwt.ts                # JWT sign/verify (jose, HS256)
    kimi.ts               # Kimi API client — prompt, markup parsing, JSON repair
    volcengine-tts.ts     # Volcengine async TTS — submit → poll → download + timestamps
    analytics.ts          # recordEvent() wrapper for analytics events table
    anonymous-id.ts       # Cookie-based anonymous user ID (1 year)
    streak-tracker.ts     # "use client" — localStorage streak/count tracking
    usage-tracker.ts      # "use client" — counts interactions for soft login prompt
    voice-context.tsx      # Context provider for TTS voice selection (localStorage)
    voices.ts             # Voice catalog (60+ Volcengine TTS voices)
    turnstile.ts          # Server-side Turnstile verification
  components/             # Client components (TodayCard, ContentCard, CardSwiper,
                          # WaveformPlayer, AudioPlayer, SyncedText, FeedbackButtons, etc.)
  types/content.ts        # TypeScript types (Scene, ContentItem, Keyword, etc.)
drizzle/
  schema.ts               # Drizzle schema: contents, feedbacks, users, events tables
scripts/                  # Admin scripts: seed-db, generate-content, generate-audio, batch ops
```

### Key patterns

- **DB access**: `db` is a Proxy that lazily initializes the Neon/Drizzle connection — import and use directly, no `await db()` needed
- **Auth**: JWT stored as httpOnly cookie (`auth_token`). Middleware protects `/api/admin/*` routes. `getCurrentUser()` reads cookie + verifies JWT on each call.
- **Content model**: JSONB columns for `mainKeyword`, `supportKeywords`, `segments`, `tags` — typed as `unknown` in TypeScript, cast at usage sites
- **Audio strategy**: No pre-generated audio files. `AudioPlayer` fetches `/api/audio/[id]` which synthesizes in real-time. Response includes MP3 body + `X-Timestamps` header (base64-encoded JSON) for word-level syncing. Cached 24 hours via `Cache-Control`.
- **Anonymous tracking**: `getAnonymousId()` reads/sets a cookie — used for feedback and analytics without login. Login prompt appears after 5 interactions (`usage-tracker.ts`).
- **"use client" hints**: Files importing React hooks or browser APIs (localStorage, Audio) must be client components. The pattern: page.tsx is server-side, components are client-side.
