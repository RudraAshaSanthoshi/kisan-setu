"use client";

import { useLanguageContext } from "@/components/providers/LanguageProvider";

export function useLanguage() {
  return useLanguageContext();
}
