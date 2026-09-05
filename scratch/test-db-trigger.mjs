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

async function inspectProfiles() {
  console.log("--- Querying profiles table definition ---");
  const { data: profiles, error } = await supabase.from("profiles").select("*").limit(5);
  if (error) {
    console.log("Profiles select error:", error.message, error.code);
  } else {
    console.log("Profiles records found:", profiles.length);
    if (profiles.length > 0) {
      console.log("Sample profile keys:", Object.keys(profiles[0]));
      console.log("Sample profile:", profiles[0]);
    }
  }

  // Also try to call signUp with minimal data to see exact error details if possible
  const testEmail = `test_${Date.now()}@kisansetu.in`;
  console.log(`\nAttempting signUp with unique email: ${testEmail}`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: "Password123!",
  });

  if (signUpErr) {
    console.log("SignUp error:", signUpErr);
  } else {
    console.log("SignUp success:", signUpData);
  }
}

inspectProfiles().catch(console.error);
