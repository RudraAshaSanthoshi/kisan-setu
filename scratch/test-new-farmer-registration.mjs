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

async function testNewFarmerRegistration() {
  const uid = Date.now();
  const email = `farmer_new_${uid}@kisansetu.in`;
  const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const password = "SecureFarmerPass123!";

  console.log("==================================================");
  console.log("TESTING BRAND NEW FARMER REGISTRATION");
  console.log("==================================================");
  console.log(`Email: ${email}`);
  console.log(`Phone: ${phone}`);

  // 1. Sign up brand new farmer
  const { data: authData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "Gurdev Singh",
        phone_number: phone,
        role: "FARMER",
        preferred_language: "pa",
      },
    },
  });

  if (signUpErr) {
    console.error("❌ Registration Error:", signUpErr.message);
    return;
  }

  const userId = authData.user?.id;
  console.log("✅ 1. Supabase Auth user created successfully!");
  console.log("   User ID:", userId);
  console.log("   Email:", authData.user?.email);
  console.log("   Role in User Metadata:", authData.user?.user_metadata?.role);

  // 2. Explicitly upsert profile to guarantee public.profiles record
  const { error: profileUpsertErr } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      full_name: "Gurdev Singh",
      phone_number: phone,
      role: "FARMER",
      preferred_language: "pa",
      district: "Ludhiana",
      state: "Punjab",
    });

  if (profileUpsertErr) {
    console.warn("⚠️ Profile Upsert Notice:", profileUpsertErr.message);
  } else {
    console.log("✅ 2. public.profiles row verified/created!");
  }

  // 3. Test sign in with the new account
  console.log("\n3. Testing Login with new account...");
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    console.log("⚠️ SignIn Result:", signInErr.message);
    if (signInErr.message.includes("Email not confirmed")) {
      console.log("   (Email confirmation is active in Supabase Auth project configuration)");
    }
  } else {
    console.log("✅ 3. Login Successful!");
    console.log("   Authenticated User ID:", signInData.user?.id);
    console.log("   Access Token Present:", !!signInData.session?.access_token);

    // Query profiles table as the authenticated user
    const authenticatedClient = createClient(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`,
        },
      },
    });

    const { data: profile, error: profQueryErr } = await authenticatedClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profQueryErr) {
      console.error("❌ Profile Query Error:", profQueryErr.message);
    } else {
      console.log("✅ 4. Profile query verified via RLS!");
      console.log("   Full Name:", profile.full_name);
      console.log("   Phone Number:", profile.phone_number);
      console.log("   Role:", profile.role);
      console.log("   Language:", profile.preferred_language);
    }
  }

  console.log("==================================================");
}

testNewFarmerRegistration().catch(console.error);
