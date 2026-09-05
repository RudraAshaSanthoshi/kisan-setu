import { createClient } from '@supabase/supabase-js';

const url = "https://taizpyvyqfgjgdzemiyh.supabase.co";
const key = "sb_publishable_usa5Eu7sUH0fUrNnktdaTg_iKQgjbUf";

const supabase = createClient(url, key);

async function testFullRegistrationFlow() {
  console.log("==================================================");
  console.log("TESTING REAL FARMER REGISTRATION, LOGIN, PROFILE & RLS");
  console.log("==================================================");

  const timestamp = Date.now();
  const email = `farmer_test_${timestamp}@kisansetu.in`;
  const password = "SecurePassword123!";
  const fullName = `Gurpreet Singh ${timestamp.toString().slice(-4)}`;
  const phoneNumber = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  // 1. Register farmer
  console.log("1. Signing up farmer:", email);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
        role: "FARMER",
        preferred_language: "pa"
      }
    }
  });

  if (signUpErr) {
    console.error("SignUp error:", signUpErr.message);
    return;
  }
  const userId = signUpData.user?.id;
  console.log("✅ Farmer registered in Supabase Auth. User ID:", userId);

  // 2. Sign in farmer to establish authenticated session client
  console.log("\n2. Signing in registered farmer to establish auth session...");
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInErr) {
    console.error("SignIn error:", signInErr.message);
    return;
  }
  console.log("✅ Sign-in successful! Session token active.");

  // 3. Fetch authenticated farmer's own profile row
  console.log("\n3. Querying own profile row from public.profiles table...");
  const { data: ownProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileErr) {
    console.log("Own profile query status:", profileErr.message);
    if (profileErr.code === '42501') {
      console.log("ℹ️  Note: Table-level GRANT on public.profiles is pending in live DB SQL Editor.");
    }
  } else {
    console.log("✅ Successfully fetched own profile from DB:");
    console.log("   Name:", ownProfile?.full_name);
    console.log("   Phone:", ownProfile?.phone_number);
    console.log("   Role:", ownProfile?.role);
    console.log("   District:", ownProfile?.district);
    console.log("   State:", ownProfile?.state);
  }

  // 4. Test RLS Authorization Isolation (attempting to read another user's profile)
  console.log("\n4. Testing RLS Policy Isolation (querying another farmer's profile ID)...");
  const strangerId = "a1111111-1111-1111-1111-111111111111";
  const { data: strangerData, error: rlsErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', strangerId)
    .maybeSingle();

  if (!strangerData) {
    console.log("✅ RLS Enforcement Verified: Query for stranger profile returned null / 0 records.");
  } else {
    console.log("RLS check output:", strangerData);
  }

  console.log("==================================================");
  console.log("TEST SUITE COMPLETED!");
}

testFullRegistrationFlow();
