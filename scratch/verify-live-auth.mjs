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

async function verifyLiveAuth() {
  const timestamp = Date.now();
  const testEmail = `farmer_verify_${timestamp}@kisansetu.in`;
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testPassword = "SecurePass123!";

  console.log("==================================================");
  console.log("VERIFYING LIVE SUPABASE AUTHENTICATION & PROFILES");
  console.log("==================================================");
  console.log(`1. Registering new farmer: ${testEmail} (Phone: ${testPhone})`);

  // 1. SignUp
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: "Gurpreet Singh Verified",
        phone_number: testPhone,
        role: "FARMER",
        preferred_language: "pa",
      },
    },
  });

  if (signUpErr) {
    console.error("❌ Registration Error:", signUpErr.message, "(code:", signUpErr.status, ")");
    return;
  }

  const userId = signUpData.user?.id;
  console.log("✅ 2. Registration Succeeded!");
  console.log("   User ID:", userId);
  console.log("   Email confirmed at:", signUpData.user?.email_confirmed_at);
  console.log("   Session returned:", !!signUpData.session);

  // 2. Sign In
  console.log("\n3. Testing Login with new account...");
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInErr) {
    console.error("❌ Login Error:", signInErr.message);
    return;
  }

  console.log("✅ 5. Login Successful!");
  console.log("   User ID:", signInData.user?.id);
  console.log("   Session Access Token Present:", !!signInData.session?.access_token);

  // 3. Profile check using session token
  const authedClient = createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${signInData.session.access_token}`,
      },
    },
  });

  const { data: profile, error: profileErr } = await authedClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileErr) {
    console.error("❌ Profile Query Error:", profileErr.message);
  } else {
    console.log("\n✅ 3. Profile Created & Verified!");
    console.log("   Full Name:", profile.full_name);
    console.log("   Phone Number:", profile.phone_number);
    console.log("✅ 4. Role Verified:", profile.role, "(Matches FARMER: " + (profile.role === "FARMER") + ")");
    console.log("   Language:", profile.preferred_language);
    console.log("   District:", profile.district);
  }

  // 4. Test User Session Verification (getUser)
  console.log("\n6. Testing Session Verification (getUser)...");
  const { data: userData, error: userErr } = await authedClient.auth.getUser();
  if (userErr || !userData.user) {
    console.error("❌ Session verification failed:", userErr?.message);
  } else {
    console.log("✅ 6. Session Persistence Verified! User ID:", userData.user.id);
  }

  // 5. Test SignOut
  console.log("\n7. Testing Logout...");
  const { error: signOutErr } = await authedClient.auth.signOut();
  if (signOutErr) {
    console.error("❌ Logout Error:", signOutErr.message);
  } else {
    console.log("✅ 7. Logout Successful!");
  }

  console.log("==================================================");
}

verifyLiveAuth().catch(console.error);
