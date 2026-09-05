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

async function testExistingFarmerLogin() {
  console.log("==================================================");
  console.log("TESTING EXISTING FARMER AUTHENTICATION & PROFILE");
  console.log("==================================================");

  // Use a user created during previous testing
  // Let's create an account with a unique email or test signin
  const email = "farmer_existing_test@kisansetu.in";
  const password = "SecureFarmerPass123!";

  console.log("1. Attempting sign in for:", email);
  let { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    console.log("SignIn notice:", signInErr.message);
    console.log("Attempting signUp for test user...");
    const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: "Ramesh Singh",
          phone_number: phone,
          role: "FARMER",
          preferred_language: "hi",
        },
      },
    });

    if (signUpErr) {
      console.log("SignUp error:", signUpErr.message);
      return;
    } else {
      console.log("SignUp SUCCESS! User ID:", signUpData.user?.id);
    }
  } else {
    console.log("✅ 1. Login SUCCESSFUL!");
    console.log("   User ID:", signInData.user?.id);
    console.log("   Access Token length:", signInData.session?.access_token?.length);

    // 2. Query public.profiles table as authenticated user
    const authedClient = createClient(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`,
        },
      },
    });

    const { data: profile, error: profErr } = await authedClient
      .from("profiles")
      .select("*")
      .eq("id", signInData.user.id)
      .single();

    if (profErr) {
      console.error("❌ Profile Lookup Error:", profErr.message);
    } else {
      console.log("✅ 2. Profile Lookup Successful!");
      console.log("   ID:", profile.id);
      console.log("   Full Name:", profile.full_name);
      console.log("   Phone Number:", profile.phone_number);
      console.log("   Role:", profile.role);
      console.log("   Language:", profile.preferred_language);
    }
  }

  console.log("==================================================");
}

testExistingFarmerLogin().catch(console.error);
