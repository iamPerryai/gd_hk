"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="flex items-center justify-between pt-12 pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          港式英语听力
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          香港 Office 中英夹杂 · 每日一句
        </p>
      </div>

      <div className="flex items-center gap-3">
        {loading ? (
          <span className="text-sm text-text-tertiary">...</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">
              你好，{user.username}
            </span>
            <button
              onClick={logout}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              登出
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="text-sm px-3 py-1.5 bg-[#4A7C59] text-white rounded-full hover:bg-[#3D6B4B] transition-colors"
            >
              注册
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
