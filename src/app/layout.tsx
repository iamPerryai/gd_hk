import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { VoiceProvider } from "@/lib/voice-context";

export const metadata: Metadata = {
  title: "港式职场英语听力学习",
  description: "通过短音频学习香港 Office 场景中的中英夹杂职场表达，地道港式粤语，轻松掌握职场英语。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <body className="min-h-screen">
        <AuthProvider>
          <VoiceProvider>{children}</VoiceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
