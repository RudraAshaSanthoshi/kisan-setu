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

async function testFullFlow() {
  console.log("==================================================");
  console.log("TESTING LIVE FARMER -> BOOKING -> QUEUE -> STAFF FLOW");
  console.log("==================================================");

  const timestamp = Date.now();
  const farmerEmail = `farmer_flow_${timestamp}@kisansetu.in`;
  const farmerPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const password = "SecurePass123!";

  // 1. Create and Sign in Farmer
  console.log("1. Registering Farmer account...");
  const { data: fAuth, error: fAuthErr } = await supabase.auth.signUp({
    email: farmerEmail,
    password,
    options: {
      data: {
        full_name: "Farmer Dev",
        phone_number: farmerPhone,
        role: "FARMER",
        preferred_language: "hi",
      },
    },
  });

  if (fAuthErr) {
    console.error("❌ Farmer Registration Failed:", fAuthErr.message);
    return;
  }
  const farmerId = fAuth.user?.id;
  console.log("✅ Farmer registered! ID:", farmerId);

  const farmerClient = createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${fAuth.session.access_token}` },
    },
  });

  // 2. View Crops & Procurement Centres
  console.log("\n2. Querying live crops and procurement centres...");
  const { data: crops, error: cropErr } = await farmerClient.from("crops").select("*").limit(1);
  const { data: centres, error: centreErr } = await farmerClient.from("procurement_centres").select("*").limit(1);

  if (cropErr || !crops || crops.length === 0) {
    console.error("❌ Crops query failed:", cropErr?.message);
    return;
  }
  if (centreErr || !centres || centres.length === 0) {
    console.error("❌ Centres query failed:", centreErr?.message);
    return;
  }

  const crop = crops[0];
  const centre = centres[0];
  console.log("✅ Crops found:", crop.name_en, "(ID:", crop.id, ")");
  console.log("✅ Centres found:", centre.name, "(ID:", centre.id, ")");

  // 3. Test RPC: create_smart_slot_booking
  console.log("\n3. Testing RPC create_smart_slot_booking...");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const { data: bookingRes, error: bookingRpcErr } = await farmerClient.rpc("create_smart_slot_booking", {
    p_crop_id: crop.id,
    p_centre_id: centre.id,
    p_booking_date: tomorrow,
    p_slot_start_time: "09:00:00",
    p_slot_end_time: "10:00:00",
    p_estimated_quantity_quintals: 45.0,
    p_vehicle_type: "Tractor",
    p_vehicle_number: "PB-10-AB-9999",
  });

  if (bookingRpcErr) {
    console.error("❌ create_smart_slot_booking RPC Error:", bookingRpcErr.message, "(code:", bookingRpcErr.code, ")");
  } else {
    console.log("✅ Slot booking created successfully via RPC!");
    console.log("   Token Code:", bookingRes.token_code);
    console.log("   Booking ID:", bookingRes.id);
  }

  // 4. Test RPC: check_in_farmer_booking
  if (bookingRes?.id) {
    console.log("\n4. Testing RPC check_in_farmer_booking...");
    const { data: checkInRes, error: checkInRpcErr } = await farmerClient.rpc("check_in_farmer_booking", {
      p_booking_id: bookingRes.id,
    });

    if (checkInRpcErr) {
      console.error("❌ check_in_farmer_booking RPC Error:", checkInRpcErr.message, "(code:", checkInRpcErr.code, ")");
    } else {
      console.log("✅ Check-in successful!");
      console.log("   Queue Entry ID:", checkInRes.id);
      console.log("   Queue Number:", checkInRes.queue_number);
      console.log("   Queue Status:", checkInRes.status);
    }
  }

  // 5. Create Staff Account and test Staff RPCs
  console.log("\n5. Registering Staff account...");
  const staffEmail = `staff_flow_${timestamp}@kisansetu.in`;
  const staffPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  const { data: sAuth, error: sAuthErr } = await supabase.auth.signUp({
    email: staffEmail,
    password,
    options: {
      data: {
        full_name: "Staff Ops",
        phone_number: staffPhone,
        role: "CENTRE_STAFF",
        assigned_centre_id: centre.id,
      },
    },
  });

  if (sAuthErr) {
    console.error("❌ Staff Registration Failed:", sAuthErr.message);
  } else {
    console.log("✅ Staff account created! ID:", sAuth.user?.id);

    // Update staff profile in public.profiles to set assigned_centre_id & role = CENTRE_STAFF
    const authedAdmin = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${sAuth.session.access_token}` } },
    });

    await authedAdmin.from("profiles").upsert({
      id: sAuth.user.id,
      full_name: "Staff Ops",
      phone_number: staffPhone,
      role: "CENTRE_STAFF",
      assigned_centre_id: centre.id,
    });

    // Test Staff CALL NEXT RPC
    console.log("\n6. Testing Staff RPC staff_call_next_farmer...");
    const { data: callNextRes, error: callNextErr } = await authedAdmin.rpc("staff_call_next_farmer", {
      p_centre_id: centre.id,
      p_counter_name: "Gate #1",
    });

    if (callNextErr) {
      console.error("❌ staff_call_next_farmer RPC Error:", callNextErr.message, "(code:", callNextErr.code, ")");
    } else {
      console.log("✅ Staff Call Next Successful!");
      console.log("   Called Queue ID:", callNextRes.id);
      console.log("   New Queue Status:", callNextRes.status);
    }
  }

  console.log("==================================================");
}

testFullFlow().catch(console.error);
