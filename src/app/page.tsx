import { db } from "@/lib/db";
import { contents } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import Header from "@/components/Header";
import TodayCard from "@/components/TodayCard";
import SceneFilter from "@/components/SceneFilter";
import CardSwiper from "@/components/CardSwiper";
import Footer from "@/components/Footer";
import type { Scene } from "@/types/content";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ scene?: string }>;
}) {
  const { scene } = await searchParams;

  const where = and(
    eq(contents.reviewStatus, "published"),
    eq(contents.audioStatus, "approved"),
  );

  const allItems = await db
    .select()
    .from(contents)
    .where(where)
    .orderBy(asc(contents.sortOrder));

  const todayIndex = Math.max(
    0,
    allItems.findIndex((item) => item.isToday),
  );

  const filteredItems = scene
    ? allItems.filter((item) => item.scene === scene)
    : allItems;

  return (
    <div className="mx-auto max-w-2xl px-5 pb-20">
      <Header />

      {/* 今日学习卡片 */}
      {allItems.length > 0 && (
        <TodayCard items={allItems} startIndex={todayIndex} />
      )}

      {/* 场景筛选 + 标题 */}
      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">
          {scene ? scene : "全部内容"}
        </h2>
        <span className="text-sm text-text-tertiary">
          {filteredItems.length} 条
        </span>
      </div>
      <SceneFilter currentScene={scene as Scene | undefined} />

      {/* 翻页卡片 */}
      {filteredItems.length === 0 ? (
        <p className="mt-12 text-center text-sm text-text-tertiary">
          暂无该场景的内容
        </p>
      ) : (
        <CardSwiper items={filteredItems} />
      )}

      {/* 详细反馈入口 */}
      {process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL && (
        <div className="mt-12 text-center">
          <a
            href={process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-separator px-5 py-2.5 text-sm text-text-secondary hover:bg-app-bg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            详细反馈
          </a>
        </div>
      )}

      <Footer />
    </div>
  );
}
