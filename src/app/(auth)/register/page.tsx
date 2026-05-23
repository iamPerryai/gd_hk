"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAuth } from "@/lib/auth-context";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password.length < 6) {
      setError("密码长度至少 6 个字符");
      return;
    }

    if (SITE_KEY && !turnstileToken) {
      setError("请完成人机验证");
      return;
    }

    setSubmitting(true);
    const result = await register(username, password, turnstileToken || undefined);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#2B2B2B] text-center mb-2">
        注册
      </h1>
      <p className="text-sm text-[#9B9B9B] text-center mb-8">
        创建你的学习账号
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#6B6B6B] mb-1.5">
            用户名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={2}
            maxLength={50}
            autoComplete="username"
            className="w-full px-4 py-3 rounded-xl border border-[#E6E4DA] bg-[#FAFAF5] text-[#2B2B2B] placeholder:text-[#C9C8C2] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59]/50 transition-all"
            placeholder="输入用户名"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B6B6B] mb-1.5">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl border border-[#E6E4DA] bg-[#FAFAF5] text-[#2B2B2B] placeholder:text-[#C9C8C2] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59]/50 transition-all"
            placeholder="至少 6 个字符"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#6B6B6B] mb-1.5">
            确认密码
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl border border-[#E6E4DA] bg-[#FAFAF5] text-[#2B2B2B] placeholder:text-[#C9C8C2] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59]/50 transition-all"
            placeholder="再次输入密码"
          />
        </div>

        {SITE_KEY && (
          <div className="flex justify-center">
            <Turnstile
              siteKey={SITE_KEY}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
              options={{ theme: "light" }}
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || (!!SITE_KEY && !turnstileToken)}
          className="w-full py-3 bg-[#4A7C59] text-white font-semibold rounded-xl hover:bg-[#3D6B4B] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? "注册中..." : "注册"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#9B9B9B]">
        已有账号？{" "}
        <Link
          href="/login"
          className="text-[#4A7C59] font-medium hover:underline"
        >
          登录
        </Link>
      </p>
    </div>
  );
}
