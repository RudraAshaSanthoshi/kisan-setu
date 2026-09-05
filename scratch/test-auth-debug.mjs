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

console.log("Supabase URL:", url);
console.log("Supabase Key:", key?.substring(0, 20) + "...");

const supabase = createClient(url, key);

async function main() {
  console.log("\n--- Testing Supabase Auth signInWithPassword ---");
  
  const testAccounts = [
    { email: "farmer@kisansetu.in", password: "password123" },
    { email: "staff@kisansetu.in", password: "password123" },
    { email: "admin@kisansetu.in", password: "password123" },
  ];

  for (const acc of testAccounts) {
    console.log(`\nAttempting login for: ${acc.email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    });

    if (error) {
      console.log(`  ERROR: ${error.message} (status: ${error.status})`);
    } else {
      console.log(`  SUCCESS! User ID: ${data.user?.id}`);
      console.log(`  Email confirmed at: ${data.user?.email_confirmed_at}`);
      console.log(`  User metadata:`, data.user?.user_metadata);

      const userSupabase = createClient(url, key, {
        global: {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        },
      });

      const { data: profile, error: profileErr } = await userSupabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileErr) {
        console.log(`  PROFILE ERROR: ${profileErr.message} (code: ${profileErr.code})`);
      } else {
        console.log(`  PROFILE FOUND:`, profile);
      }
    }
  }

  const { data: crops, error: cropErr } = await supabase.from("crops").select("id, name").limit(3);
  console.log("\nCrops query check:", cropErr ? `Error: ${cropErr.message}` : `Found ${crops?.length} crops`);
}

main().catch(console.error);
