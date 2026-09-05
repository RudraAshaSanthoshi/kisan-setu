"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";

const VOICE_LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  pa: "pa-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  gu: "gu-IN",
  bn: "bn-IN",
  kn: "kn-IN",
};

export interface UseVoiceGuidanceReturn {
  speak: (text: string) => void;
  stop: () => void;
  toggle: (text: string) => void;
  isPlaying: boolean;
  isSupported: boolean;
  activeLocale: string;
  speechLang: string;
}

export function useVoiceGuidance(): UseVoiceGuidanceReturn {
  const { locale } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel error
      }
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {
        return;
      }

      try {
        // Cancel any ongoing audio speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const targetLang = VOICE_LANG_MAP[locale] || "en-IN";
        utterance.lang = targetLang;
        utterance.rate = 0.9; // Slightly slower for clear farmer readability

        // Match available browser voice if present
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const langCode = targetLang.split("-")[0].toLowerCase();
          const matchedVoice = voices.find((v) => {
            const vLang = v.lang.toLowerCase().replace("_", "-");
            return vLang.startsWith(langCode);
          });
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
        }

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("SpeechSynthesis error:", err);
        setIsPlaying(false);
      }
    },
    [locale]
  );

  const toggle = useCallback(
    (text: string) => {
      if (isPlaying) {
        stop();
      } else {
        speak(text);
      }
    },
    [isPlaying, speak, stop]
  );

  const speechLang = VOICE_LANG_MAP[locale] || "en-IN";

  return {
    speak,
    stop,
    toggle,
    isPlaying,
    isSupported,
    activeLocale: locale,
    speechLang,
  };
}
