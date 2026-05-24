"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAuth } from "@/lib/auth-context";
import { useTurnstile } from "@/lib/use-turnstile";
import { Dialog } from "./ui/dialog";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export default function AuthDialog({ open, onClose, initialMode = "login" }: AuthDialogProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const turnstileId = `auth-dialog-turnstile-${mode}`;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const turnstile = useTurnstile(`${open}-${mode}`, turnstileId);

  const handleClose = useCallback(() => {
    setError("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    turnstile.reset();
    setSubmitting(false);
    setSuccess(false);
    setMode(initialMode);
    onClose();
  }, [initialMode, onClose, turnstile]);

  const switchMode = useCallback((nextMode: "login" | "register") => {
    setMode(nextMode);
    setError("");
    setPassword("");
    setConfirmPassword("");
    turnstile.reset();
  }, [turnstile]);

  // M18 fix: removed useCallback — deps (username, password, confirmPassword) change on
  // every keystroke, defeating the purpose. Form values are read from state directly.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (turnstile.mustSolveBeforeSubmit && !turnstile.token) {
      setError("请完成人机验证");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password.length < 4) {
      setError("密码至少需要 4 个字符");
      return;
    }

    setSubmitting(true);

    const action = mode === "login" ? login : register;
    const result = await action(username, password, turnstile.token || undefined);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      turnstile.setToken("");
    } else {
      setSuccess(true);
      successTimerRef.current = setTimeout(() => handleClose(), 1200);
    }
  }

  // Clean up the success timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-sm">
      {success ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#4A7C59]/10">
            <svg
              className="h-7 w-7 text-[#4A7C59]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-[#2B2B2B]">
            {mode === "login" ? "登录成功" : "注册成功"}
          </p>
          <p className="mt-1 text-sm text-[#9B9B9B]">正在跳转...</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex rounded-xl bg-[#F0EFE9] p-1">
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-white text-[#2B2B2B] shadow-sm"
                  : "text-[#9B9B9B] hover:text-[#6B6B6B]"
              }`}
            >
              登录
            </button>
            <button
              onClick={() => switchMode("register")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === "register"
                  ? "bg-white text-[#2B2B2B] shadow-sm"
                  : "text-[#9B9B9B] hover:text-[#6B6B6B]"
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#6B6B6B]">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl border border-[#E6E4DA] bg-[#FAFAF5] px-4 py-3 text-[#2B2B2B] placeholder:text-[#C9C8C2] transition-all focus:border-[#4A7C59]/50 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30"
                placeholder="输入用户名"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#6B6B6B]">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-[#E6E4DA] bg-[#FAFAF5] px-4 py-3 text-[#2B2B2B] placeholder:text-[#C9C8C2] transition-all focus:border-[#4A7C59]/50 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30"
                placeholder="输入密码"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#6B6B6B]">
                  确认密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-[#E6E4DA] bg-[#FAFAF5] px-4 py-3 text-[#2B2B2B] placeholder:text-[#C9C8C2] transition-all focus:border-[#4A7C59]/50 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30"
                  placeholder="再次输入密码"
                />
              </div>
            )}

            {turnstile.shouldRender && (
              <div className="flex justify-center">
                <Turnstile
                  key={mode}
                  id={turnstileId}
                  siteKey={turnstile.siteKey}
                  onWidgetLoad={turnstile.markLoaded}
                  onSuccess={turnstile.setToken}
                  onExpire={() => turnstile.setToken("")}
                  onError={turnstile.markFailed}
                  onUnsupported={turnstile.markFailed}
                  onTimeout={turnstile.markFailed}
                  options={{ theme: "light" }}
                />
              </div>
            )}
            {turnstile.loadFailed && process.env.NODE_ENV !== "development" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-600">
                人机验证暂时无法加载，已跳过验证
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || (turnstile.mustSolveBeforeSubmit && !turnstile.token)}
              className="w-full rounded-xl bg-[#4A7C59] py-3 font-semibold text-white transition-all hover:bg-[#3D6B4B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? mode === "login"
                  ? "登录中..."
                  : "注册中..."
                : mode === "login"
                  ? "登录"
                  : "注册"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#9B9B9B]">
            {mode === "login" ? (
              <>
                还没有账号？{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-medium text-[#4A7C59] hover:underline"
                >
                  注册
                </button>
              </>
            ) : (
              <>
                已有账号？{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-medium text-[#4A7C59] hover:underline"
                >
                  登录
                </button>
              </>
            )}
          </p>
        </>
      )}
    </Dialog>
  );
}
