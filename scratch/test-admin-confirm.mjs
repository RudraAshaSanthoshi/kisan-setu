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

async function checkAccountConfirmation() {
  const testEmail = "farmer@kisansetu.in";
  const testPassword = "password123";

  // Try signing in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  console.log("farmer@kisansetu.in login result:", error ? error.message : "Success! ID: " + data.user?.id);
}

checkAccountConfirmation().catch(console.error);
