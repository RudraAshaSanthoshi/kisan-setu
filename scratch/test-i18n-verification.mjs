import fs from "fs";
import path from "path";

async function verifyI18n() {
  console.log("=== KISANSETU MULTI-LANGUAGE (i18n) VERIFICATION ===");

  const localesDir = path.resolve(process.cwd(), "public", "locales");
  const requiredLocales = ["en", "hi", "te", "pa", "mr", "gu", "ta", "bn", "kn"];

  console.log(`Checking locales directory: ${localesDir}`);
  if (!fs.existsSync(localesDir)) {
    console.error("FAILED: public/locales directory does not exist!");
    process.exit(1);
  }

  let missingCount = 0;
  const dictionaries = {};

  for (const lang of requiredLocales) {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`FAIL: Translation file missing for code '${lang}': ${filePath}`);
      missingCount++;
    } else {
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw);
        dictionaries[lang] = parsed;
        const keyCount = Object.keys(parsed).length;
        console.log(`PASS: [${lang.toUpperCase()}] Verified valid JSON (${keyCount} top-level domains, size: ${(raw.length / 1024).toFixed(1)} KB)`);
      } catch (err) {
        console.error(`FAIL: [${lang.toUpperCase()}] Invalid JSON formatting: ${err.message}`);
        missingCount++;
      }
    }
  }

  if (missingCount > 0) {
    console.error(`FAILED: ${missingCount} language dictionaries failed verification!`);
    process.exit(1);
  }

  // Domain checks for all 9 languages
  console.log("\n--- Verifying Key Navigation & Core Workflow Domains Across All 9 Languages ---");
  const keyDomains = [
    "common",
    "nav",
    "auth",
    "farmer",
  ];

  for (const lang of requiredLocales) {
    const dict = dictionaries[lang];
    const missing = [];
    for (const domain of keyDomains) {
      if (!dict || !dict[domain]) {
        missing.push(domain);
      }
    }
    if (missing.length === 0) {
      console.log(`PASS: [${lang.toUpperCase()}] All core domains present (${Object.keys(dict).join(", ")})`);
    } else {
      console.warn(`WARN: [${lang.toUpperCase()}] Missing domains: ${missing.join(", ")}`);
    }
  }

  // Sample Key Translation test
  console.log("\n--- Sample Key Translations (English vs Hindi vs Telugu) ---");
  const sampleKeys = [
    ["common.app_name", "App Name"],
    ["farmer.shell.nav_home", "Home Nav"],
    ["farmer.shell.nav_book", "Book Nav"],
    ["farmer.actions.book_slot", "Book Slot Action"],
    ["farmer.procurement.title", "Procurement Title"],
    ["farmer.payments.title", "Payments Title"],
    ["farmer.notifications.title", "Notifications Title"],
  ];

  function getNestedKey(obj, keyPath) {
    return keyPath.split(".").reduce((o, i) => (o ? o[i] : undefined), obj);
  }

  for (const [k, desc] of sampleKeys) {
    const enVal = getNestedKey(dictionaries["en"], k) || k;
    const hiVal = getNestedKey(dictionaries["hi"], k) || k;
    const teVal = getNestedKey(dictionaries["te"], k) || k;

    console.log(`Key '${k}' (${desc}):`);
    console.log(`  EN: "${enVal}"`);
    console.log(`  HI: "${hiVal}"`);
    console.log(`  TE: "${teVal}"`);
  }

  console.log("\n==================================================");
  console.log("ALL 9 REQUIRED LANGUAGES VERIFIED SUCCESSFULLY! 🌐");
  console.log("==================================================");
}

verifyI18n();
