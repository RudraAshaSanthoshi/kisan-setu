"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, LocaleConfig } from "@/lib/i18n/config";
import { getDictionary, getInitialDictionary, translateKey, Dictionary } from "@/lib/i18n/dictionaries";

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  supportedLocales: LocaleConfig[];
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(DEFAULT_LOCALE);
  const [dictionary, setDictionary] = useState<Dictionary | null>(() => getInitialDictionary(DEFAULT_LOCALE));
  const [fallbackDict, setFallbackDict] = useState<Dictionary | null>(() => getInitialDictionary("en"));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Synchronize locale state with localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kisan_setu_locale");
      if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // Ignore localStorage access errors if restricted
    }
  }, []);

  // Fetch dictionary asynchronously whenever locale state updates
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([getDictionary(locale), getDictionary("en")])
      .then(([dict, fallback]) => {
        if (isMounted) {
          setDictionary(dict);
          setFallbackDict(fallback);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [locale]);

  const setLocale = (newLocale: string) => {
    if (SUPPORTED_LOCALES.some((l) => l.code === newLocale)) {
      setLocaleState(newLocale);
      try {
        localStorage.setItem("kisan_setu_locale", newLocale);
      } catch {
        // Ignore localStorage error if restricted
      }
      document.documentElement.lang = newLocale;
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translateKey(dictionary, fallbackDict, key, params);
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        supportedLocales: SUPPORTED_LOCALES,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguageContext must be used within a LanguageProvider");
  }
  return context;
}
