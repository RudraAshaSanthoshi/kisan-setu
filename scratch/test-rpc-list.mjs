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

async function testRpcs() {
  console.log("Testing create_procurement_slot RPC...");
  const { data, error } = await supabase.rpc("create_procurement_slot", {
    p_declaration_id: null,
    p_centre_id: "b1000000-0000-0000-0000-000000000001",
    p_booking_date: "2026-09-06",
    p_slot_start_time: "09:00:00",
    p_slot_end_time: "10:00:00",
    p_estimated_quantity_quintals: 10,
    p_vehicle_type: "Tractor",
    p_vehicle_number: "PB-10-AB-1234",
  });

  console.log("create_procurement_slot result:", error ? `${error.message} (${error.code})` : "SUCCESS!");
}

testRpcs().catch(console.error);
