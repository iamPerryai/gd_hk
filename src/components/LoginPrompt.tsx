"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { shouldPromptLogin, resetUsage } from "@/lib/usage-tracker";
import AuthDialog from "./AuthDialog";

export default function LoginPrompt() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Show prompt after some usage, but only for unauthenticated users
  useEffect(() => {
    if (user || dismissed) return;
    // Delay check slightly to avoid flashing on first load
    const timer = setTimeout(() => {
      if (shouldPromptLogin()) {
        setVisible(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, dismissed]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
  }, []);

  const handleLogin = useCallback(() => {
    setVisible(false);
    setShowAuth(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-[#C9C8C2] hover:text-[#6B6B6B] transition-colors"
          aria-label="关闭"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-[#4A7C59]/10 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-[#4A7C59]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#2B2B2B]">创建账号，追踪学习进度</h3>
          <p className="mt-1 text-sm text-[#9B9B9B]">
            注册账号后可以记录学习历史，随时回顾进步轨迹。
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 text-sm font-medium text-[#6B6B6B] bg-[#F0EFE9] rounded-xl hover:bg-[#E6E4DA] transition-colors"
          >
            先不了
          </button>
          <button
            onClick={handleLogin}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#4A7C59] rounded-xl hover:bg-[#3D6B4B] transition-colors"
          >
            去登录
          </button>
        </div>
      </div>

      {/* Auth Dialog (modal login/register) */}
      <AuthDialog
        open={showAuth}
        onClose={() => setShowAuth(false)}
      />
    </div>
  );
}
