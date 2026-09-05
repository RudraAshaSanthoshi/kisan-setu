"use client";

import React from "react";
import { useVoiceGuidance } from "@/hooks/useVoiceGuidance";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface VoiceButtonProps {
  text: string;
  label?: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function VoiceButton({
  text,
  label,
  className = "",
  size = "sm",
  variant = "outline",
}: VoiceButtonProps) {
  const { toggle, isPlaying, isSupported } = useVoiceGuidance();
  const { locale } = useLanguage();

  if (!isSupported) {
    return null; // Graceful fallback if browser does not support Web Speech API
  }

  const defaultLabel = locale === "hi" ? "सुनें" : locale === "te" ? "వినండి" : "Listen";

  return (
    <Button
      type="button"
      variant={isPlaying ? "default" : variant}
      size={size}
      onClick={() => toggle(text)}
      aria-label={isPlaying ? "Stop Voice Guidance" : "Listen to Voice Guidance"}
      title={isPlaying ? "Stop Audio" : "Play Voice Guidance"}
      className={`rounded-full font-bold transition-all border-emerald-500/50 ${
        isPlaying
          ? "bg-emerald-600 text-white shadow-card animate-pulse"
          : "hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
      } ${className}`}
    >
      {isPlaying ? (
        <span className="flex items-center gap-1.5 text-xs">
          <VolumeX className="h-4 w-4 shrink-0 text-white animate-bounce" />
          <span>Stop</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs">
          <Volume2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          {size !== "icon" && <span>{label || defaultLabel}</span>}
        </span>
      )}
    </Button>
  );
}
