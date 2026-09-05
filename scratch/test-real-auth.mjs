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

async function testSignupAndSignin() {
  const testEmail = "testfarmer1@kisansetu.in";
  const testPassword = "Password123!";

  console.log("1. Attempting signUp for:", testEmail);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: "Test Farmer One",
        phone_number: "9876543210",
        role: "FARMER",
        preferred_language: "hi",
      },
    },
  });

  if (signUpErr) {
    console.log("SignUp error:", signUpErr.message);
  } else {
    console.log("SignUp success!");
    console.log("  User ID:", signUpData.user?.id);
    console.log("  Session exists:", !!signUpData.session);
    console.log("  Identities:", signUpData.user?.identities);

    // If auto-confirm is enabled, session will exist. If email confirm is enabled, session is null until confirmed.
  }

  console.log("\n2. Attempting signInWithPassword for:", testEmail);
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInErr) {
    console.log("SignIn error:", signInErr.message, "(code:", signInErr.status, ")");
  } else {
    console.log("SignIn success!");
    console.log("  User ID:", signInData.user?.id);
    console.log("  Access token length:", signInData.session?.access_token?.length);

    // Query profiles table
    const authenticatedClient = createClient(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`,
        },
      },
    });

    const { data: profile, error: profErr } = await authenticatedClient
      .from("profiles")
      .select("*")
      .eq("id", signInData.user.id)
      .single();

    if (profErr) {
      console.log("Profile lookup error:", profErr.message, profErr.code);
    } else {
      console.log("Profile lookup success! Role:", profile.role, "Name:", profile.full_name);
    }
  }
}

testSignupAndSignin().catch(console.error);
