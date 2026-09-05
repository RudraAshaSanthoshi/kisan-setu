export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  flagEmoji?: string;
}

/**
 * Extensible collection of supported Indian languages.
 * Additional languages can be added here without modifying business logic or React components.
 */
export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
];

export const DEFAULT_LOCALE = "hi";
export const FALLBACK_LOCALE = "en";
