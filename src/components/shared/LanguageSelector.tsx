"use client";

import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { locale, setLocale, supportedLocales } = useLanguage();

  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 shadow-subtle backdrop-blur-sm">
      <Globe className="h-4 w-4 text-primary shrink-0" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
        aria-label="Select Language"
      >
        {supportedLocales.map((loc) => (
          <option key={loc.code} value={loc.code} className="bg-card text-foreground">
            {loc.nativeName} ({loc.name})
          </option>
        ))}
      </select>
    </div>
  );
}
