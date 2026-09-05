import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const [key, ...vals] = trimmed.split("=");
    envVars[key.trim()] = vals.join("=").trim();
  }
}

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function diagnoseLiveRegistration() {
  const uniqueId = Date.now();

  console.log("--- TEST 1: Register WITH full_name, phone_number, role in metadata ---");
  const email1 = `test_meta_${uniqueId}@kisansetu.in`;
  const phone1 = `9${String(uniqueId).slice(-9)}`;
  console.log(`Email: ${email1}, Phone: ${phone1}`);

  const res1 = await supabase.auth.signUp({
    email: email1,
    password: "Password123!",
    options: {
      data: {
        full_name: "Test Farmer Meta",
        phone_number: phone1,
        role: "FARMER",
        preferred_language: "hi",
      },
    },
  });

  if (res1.error) {
    console.log("TEST 1 ERROR:", res1.error.message, "| status:", res1.error.status);
  } else {
    console.log("TEST 1 SUCCESS:", res1.data.user?.id, "| session:", !!res1.data.session);
  }

  console.log("\n--- TEST 2: Register WITHOUT phone_number in metadata ---");
  const email2 = `test_nophone_${uniqueId}@kisansetu.in`;
  console.log(`Email: ${email2}`);

  const res2 = await supabase.auth.signUp({
    email: email2,
    password: "Password123!",
    options: {
      data: {
        full_name: "Test Farmer NoPhone",
      },
    },
  });

  if (res2.error) {
    console.log("TEST 2 ERROR:", res2.error.message, "| status:", res2.error.status);
  } else {
    console.log("TEST 2 SUCCESS:", res2.data.user?.id, "| session:", !!res2.data.session);
  }

  console.log("\n--- TEST 3: Register WITH duplicate phone_number ---");
  const email3 = `test_dupphone_${uniqueId}@kisansetu.in`;
  console.log(`Email: ${email3}, Phone: ${phone1} (same as TEST 1)`);

  const res3 = await supabase.auth.signUp({
    email: email3,
    password: "Password123!",
    options: {
      data: {
        full_name: "Test Farmer DupPhone",
        phone_number: phone1,
      },
    },
  });

  if (res3.error) {
    console.log("TEST 3 ERROR:", res3.error.message, "| status:", res3.error.status);
  } else {
    console.log("TEST 3 SUCCESS:", res3.data.user?.id, "| session:", !!res3.data.session);
  }
}

diagnoseLiveRegistration().catch(console.error);
