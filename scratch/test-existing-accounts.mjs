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

async function testEmails() {
  const testEmails = [
    "farmer@kisansetu.in",
    "staff@kisansetu.in",
    "admin@kisansetu.in",
    "ramesh@kisansetu.in",
    "testfarmer@kisansetu.in",
    "farmer1@kisansetu.in",
    "test@example.com",
    "farmer@gmail.com",
    "test_1788602960452@kisansetu.in",
  ];

  for (const email of testEmails) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: "password123",
    });

    if (!error) {
      console.log(`FOUND WORKING CONFIRMED USER! Email: ${email}, ID: ${data.user.id}`);
      return;
    } else {
      console.log(`Email ${email}: ${error.message}`);
    }
  }
}

testEmails().catch(console.error);
