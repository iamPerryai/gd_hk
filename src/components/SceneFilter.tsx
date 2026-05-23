"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Scene } from "@/types/content";

const SCENES: { key: string; label: string }[] = [
  { key: "", label: "全部" },
  { key: "Meeting", label: "Meeting" },
  { key: "Follow up", label: "Follow up" },
  { key: "Approval", label: "Approval" },
  { key: "Client", label: "Client" },
  { key: "Teamwork", label: "Teamwork" },
  { key: "OT / Urgent", label: "OT / Urgent" },
];

export default function SceneFilter({ currentScene }: { currentScene?: Scene }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key) {
      params.set("scene", key);
    } else {
      params.delete("scene");
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="mt-8 overflow-x-auto pb-2">
      <div className="flex gap-1.5 rounded-xl bg-[#e5e5ea]/60 p-1 w-fit">
        {SCENES.map((s) => {
          const isActive = currentScene
            ? s.key === currentScene
            : s.key === "";
          return (
            <button
              key={s.key}
              onClick={() => handleFilter(s.key)}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
