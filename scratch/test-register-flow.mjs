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

async function testRegistration() {
  const uniqueId = Date.now();
  const testEmail = `farmer_${uniqueId}@kisansetu.in`;
  const testPhone = `98${String(uniqueId).slice(-8)}`;
  const password = "Password123!";

  console.log(`Registering new test farmer: ${testEmail}, phone: ${testPhone}`);

  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: testEmail,
    password: password,
    options: {
      data: {
        full_name: "Test Farmer " + uniqueId,
        phone_number: testPhone,
        role: "FARMER",
        preferred_language: "hi",
      },
    },
  });

  if (authErr) {
    console.log("Auth signUp error:", authErr.message);
    return;
  }

  console.log("Auth signUp successful! User ID:", authData.user?.id);
  console.log("Session returned:", !!authData.session);

  if (authData.user) {
    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        full_name: "Test Farmer " + uniqueId,
        phone_number: testPhone,
        role: "FARMER",
        preferred_language: "hi",
        district: "Ludhiana",
        state: "Punjab",
      });

    if (profileErr) {
      console.log("Profile upsert notice:", profileErr.message);
    } else {
      console.log("Profile upsert successful!");
    }
  }
}

testRegistration().catch(console.error);
