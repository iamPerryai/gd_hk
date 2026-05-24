"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { voices, DEFAULT_VOICE_ID, VOICE_STORAGE_KEY, type Voice } from "@/lib/voices";

type VoiceContextValue = {
  voices: Voice[];
  currentVoice: Voice;
  setVoice: (voice: Voice) => void;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

// O(1) voice lookup by ID (replaces voices.find in multiple places)
const voiceMap = new Map(voices.map((v) => [v.id, v]));

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [currentVoice, setCurrentVoice] = useState<Voice>(() => {
    return voiceMap.get(DEFAULT_VOICE_ID) ?? voices[0];
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VOICE_STORAGE_KEY);
      if (stored) {
        const found = voiceMap.get(stored);
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

  // Memoize context value to prevent unnecessary consumer re-renders
  const value = useMemo(
    () => ({ voices, currentVoice, setVoice }),
    [currentVoice, setVoice],
  );

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within VoiceProvider");
  return ctx;
}
