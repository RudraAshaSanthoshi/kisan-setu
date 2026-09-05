import fs from "fs";
import path from "path";
import assert from "assert";

console.log("==================================================");
console.log("  KISANSETU VOICE GUIDANCE REQUIREMENT #22 TEST   ");
console.log("==================================================");

// 1. Verify VOICE_LANG_MAP covers all 9 required locales
const useVoicePath = path.resolve("src/hooks/useVoiceGuidance.ts");
const useVoiceContent = fs.readFileSync(useVoicePath, "utf-8");

const requiredLocales = ["en", "hi", "te", "pa", "mr", "ta", "gu", "bn", "kn"];
const expectedSpeechLangs = {
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

console.log("\n[TEST 1] Checking Language to Speech Mapping in useVoiceGuidance.ts...");
requiredLocales.forEach((loc) => {
  const targetSpeech = expectedSpeechLangs[loc];
  assert(
    useVoiceContent.includes(`${loc}: "${targetSpeech}"`),
    `Missing mapping for ${loc} -> ${targetSpeech}`
  );
  console.log(`  ✓ ${loc} -> ${targetSpeech} defined`);
});

// 2. Verify VoiceButton component integration
console.log("\n[TEST 2] Verifying VoiceButton component...");
const voiceButtonPath = path.resolve("src/components/shared/VoiceButton.tsx");
assert(fs.existsSync(voiceButtonPath), "VoiceButton.tsx missing");
const voiceButtonContent = fs.readFileSync(voiceButtonPath, "utf-8");
assert(voiceButtonContent.includes("useVoiceGuidance"), "VoiceButton does not use useVoiceGuidance");
assert(voiceButtonContent.includes("Volume2") && voiceButtonContent.includes("VolumeX"), "VoiceButton missing volume icons");
assert(voiceButtonContent.includes("if (!isSupported)"), "VoiceButton missing fallback check when unsupported");
console.log("  ✓ VoiceButton component correctly handles Web Speech API fallback and controls");

// 3. Verify Voice Guidance present on 5 target Farmer screens
console.log("\n[TEST 3] Verifying Voice Guidance inclusion across 5 priority farmer screens...");
const priorityScreens = [
  { name: "Farmer Dashboard", path: "src/app/(farmer)/farmer/page.tsx" },
  { name: "Book Slot", path: "src/app/(farmer)/farmer/book-slot/page.tsx" },
  { name: "Live Queue", path: "src/app/(farmer)/farmer/queue/page.tsx" },
  { name: "Procurement", path: "src/app/(farmer)/farmer/procurement/page.tsx" },
  { name: "Payments", path: "src/app/(farmer)/farmer/payments/page.tsx" },
];

priorityScreens.forEach((screen) => {
  const fullPath = path.resolve(screen.path);
  assert(fs.existsSync(fullPath), `Screen missing: ${screen.path}`);
  const content = fs.readFileSync(fullPath, "utf-8");
  assert(
    content.includes("VoiceButton") || content.includes("useVoiceGuidance"),
    `Screen ${screen.name} does not import or render VoiceButton!`
  );
  console.log(`  ✓ Screen '${screen.name}' (${screen.path}) includes Voice Guidance`);
});

// 4. Verify Graceful Fallback & Speech Synthesis Safety
console.log("\n[TEST 4] Verifying Graceful Fallback Logic...");
assert(
  useVoiceContent.includes('typeof window !== "undefined"') &&
    useVoiceContent.includes('"speechSynthesis" in window'),
  "useVoiceGuidance does not guard against SSR or unsupported SpeechSynthesis"
);
assert(
  useVoiceContent.includes("cancel()"),
  "useVoiceGuidance does not include stop/cancel speech control"
);
console.log("  ✓ SSR guard, Web Speech browser feature check, and cancel/stop controls verified");

console.log("\n==================================================");
console.log("  ALL VOICE GUIDANCE VERIFICATION TESTS PASSED!    ");
console.log("==================================================");
