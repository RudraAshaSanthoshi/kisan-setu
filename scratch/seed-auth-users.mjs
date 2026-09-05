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

const DEMO_USERS = [
  {
    email: "farmer@kisansetu.in",
    password: "password123",
    fullName: "Ramesh Singh",
    phone: "9876543210",
    role: "FARMER",
    lang: "hi",
  },
  {
    email: "staff@kisansetu.in",
    password: "password123",
    fullName: "Gurpreet Singh",
    phone: "9876543211",
    role: "CENTRE_STAFF",
    lang: "pa",
  },
  {
    email: "admin@kisansetu.in",
    password: "password123",
    fullName: "Dr. A. K. Sharma",
    phone: "9876543212",
    role: "ADMIN",
    lang: "en",
  },
];

async function seedUsers() {
  for (const u of DEMO_USERS) {
    console.log(`\nAttempting signUp for ${u.email}...`);
    const { data: res, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: {
        data: {
          full_name: u.fullName,
          phone_number: u.phone,
          role: u.role,
          preferred_language: u.lang,
        },
      },
    });

    if (error) {
      console.log(`  SignUp Error: ${error.message}`);
    } else {
      console.log(`  SignUp Result: User ID ${res.user?.id}, session exists: ${!!res.session}`);
      if (res.user && !res.session) {
        console.log(`  Email confirmation required for ${u.email}`);
      }
    }
  }
}

seedUsers().catch(console.error);
