"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { voices, DEFAULT_VOICE_ID, VOICE_STORAGE_KEY, type Voice } from "@/lib/voices";

type VoiceContextValue = {
  voices: Voice[];
  currentVoice: Voice;
  setVoice: (voice: Voice) => void;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [currentVoice, setCurrentVoice] = useState<Voice>(() => {
    // Default during SSR
    return voices.find((v) => v.id === DEFAULT_VOICE_ID) ?? voices[0];
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VOICE_STORAGE_KEY);
      if (stored) {
        const found = voices.find((v) => v.id === stored);
        if (found) setCurrentVoice(found);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const setVoice = useCallback((voice: Voice) => {
    setCurrentVoice(voice);
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, voice.id);
    } catch {
      // localStorage not available
    }
  }, []);

  return (
    <VoiceContext.Provider value={{ voices, currentVoice, setVoice }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within VoiceProvider");
  return ctx;
}
