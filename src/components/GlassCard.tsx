"use client";

import { type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Accent color for the top highlight bar */
  accent?: boolean;
  /** Subtle hover lift effect */
  hoverable?: boolean;
  /** Padding variant */
  padded?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export default function GlassCard({
  children,
  className = "",
  accent = false,
  hoverable = false,
  padded = "md",
}: GlassCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border
        bg-white/60 backdrop-blur-xl
        border-white/40
        shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)]
        ${hoverable ? "hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_30px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 transition-all duration-300" : ""}
        ${paddingMap[padded]}
        ${className}
      `}
    >
      {/* Subtle top highlight edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      {/* Accent glow in top-right */}
      {accent && (
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#4A7C59]/8 rounded-full blur-2xl pointer-events-none" />
      )}

      {children}
    </div>
  );
}
