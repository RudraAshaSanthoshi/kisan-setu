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

async function testFullAuth() {
  console.log("=== 1. Testing Invalid Credentials ===");
  const { data: badAuth, error: badErr } = await supabase.auth.signInWithPassword({
    email: "fake_nonexistent_user@kisansetu.in",
    password: "WrongPassword123!",
  });

  console.log("Invalid credentials result:", badErr ? `Rejected properly: ${badErr.message}` : "FAIL: accepted invalid credentials!");

  console.log("\n=== 2. Testing Registration with unique user ===");
  const uid = Date.now();
  const email = `farmer_${uid}@kisansetu.in`;
  const phone = `97${String(uid).slice(-8)}`;

  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password: "Password123!",
    options: {
      data: {
        full_name: `Verified Farmer ${uid}`,
        phone_number: phone,
        role: "FARMER",
        preferred_language: "hi",
      },
    },
  });

  if (signUpErr) {
    console.log("SignUp Result:", signUpErr.message);
  } else {
    console.log("SignUp SUCCESS! User ID:", signUpData.user?.id);
    console.log("Session active:", !!signUpData.session);
    if (!signUpData.session) {
      console.log("-> Email confirmation is required by Supabase Auth configuration.");
    }
  }
}

testFullAuth().catch(console.error);
