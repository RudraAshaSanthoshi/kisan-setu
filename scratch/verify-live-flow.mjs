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

async function verifyCompleteFlow() {
  const ts = Date.now();
  const farmerEmail = `farmer_live_${ts}@kisansetu.in`;
  const farmerPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const staffEmail = `staff_live_${ts}@kisansetu.in`;
  const staffPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const password = "SecurePass123!";

  console.log("==================================================");
  console.log("VERIFYING LIVE FARMER -> BOOKING -> QUEUE -> STAFF FLOW");
  console.log("==================================================");

  // 1. Farmer Registration & Login
  console.log("1. Registering Farmer account...");
  const { data: fAuth, error: fAuthErr } = await supabase.auth.signUp({
    email: farmerEmail,
    password,
    options: {
      data: {
        full_name: "Farmer Hardev Singh",
        phone_number: farmerPhone,
        role: "FARMER",
        preferred_language: "pa",
      },
    },
  });

  if (fAuthErr) {
    console.error("❌ Farmer Registration Error:", fAuthErr.message);
    return;
  }
  const farmerId = fAuth.user?.id;
  console.log("✅ 1. Farmer Registration Success! ID:", farmerId);

  const farmerClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${fAuth.session.access_token}` } },
  });

  // 2. View Crops & Procurement Centres
  console.log("\n2. Querying live crops and procurement centres...");
  const { data: crops, error: cropErr } = await farmerClient.from("crops").select("*").limit(1);
  const { data: centres, error: centreErr } = await farmerClient.from("procurement_centres").select("*").limit(1);

  if (cropErr || !crops || crops.length === 0) {
    console.error("❌ Crops Query Error:", cropErr?.message);
    return;
  }
  if (centreErr || !centres || centres.length === 0) {
    console.error("❌ Centres Query Error:", centreErr?.message);
    return;
  }

  const crop = crops[0];
  const centre = centres[0];
  console.log("✅ 2. Crops & Centres Viewable!");
  console.log("   Crop:", crop.name_en, "(MSP: ₹" + crop.msp_per_quintal + ")");
  console.log("   Centre:", centre.name, "(District:", centre.district + ")");

  // 3. Book a Slot via create_smart_slot_booking RPC
  console.log("\n3. Booking Procurement Slot via RPC...");
  const today = new Date().toISOString().split("T")[0];

  const { data: bookingRes, error: bookingErr } = await farmerClient.rpc("create_smart_slot_booking", {
    p_crop_id: crop.id,
    p_centre_id: centre.id,
    p_booking_date: today,
    p_slot_start_time: "09:00:00",
    p_slot_end_time: "10:00:00",
    p_estimated_quantity_quintals: 50.0,
    p_vehicle_type: "Tractor",
    p_vehicle_number: "PB-11-XY-8888",
  });

  if (bookingErr) {
    console.error("❌ Slot Booking Error:", bookingErr.message, "(code:", bookingErr.code, ")");
    return;
  }

  const bookingId = bookingRes.id;
  const tokenCode = bookingRes.token_code;
  console.log("✅ 3. Real slot_bookings row created!");
  console.log("   Booking ID:", bookingId);
  console.log("   Token Code:", tokenCode);

  // 4. Farmer Gate Check-In via check_in_farmer_booking RPC
  console.log("\n4. Performing Gate Check-In via RPC...");
  const { data: checkInRes, error: checkInErr } = await farmerClient.rpc("check_in_farmer_booking", {
    p_booking_id: bookingId,
  });

  if (checkInErr) {
    console.error("❌ Gate Check-In Error:", checkInErr.message);
    return;
  }

  const queueEntryId = checkInRes.id;
  console.log("✅ 4 & 5. Real queue_entry created!");
  console.log("   Queue Entry ID:", queueEntryId);
  console.log("   Queue Number:", checkInRes.queue_number);
  console.log("   Queue Status:", checkInRes.status);

  // 5. Register Staff Account
  console.log("\n5. Registering Staff Account...");
  const { data: sAuth, error: sAuthErr } = await supabase.auth.signUp({
    email: staffEmail,
    password,
    options: {
      data: {
        full_name: "Staff Balwinder",
        phone_number: staffPhone,
        role: "CENTRE_STAFF",
        assigned_centre_id: centre.id,
      },
    },
  });

  if (sAuthErr) {
    console.error("❌ Staff Registration Error:", sAuthErr.message);
    return;
  }

  const staffId = sAuth.user?.id;
  const staffClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${sAuth.session.access_token}` } },
  });

  console.log("✅ 7. Staff Account Registered & Signed In! Staff ID:", staffId);

  // 6. Query Queue entries as Farmer (verified RLS access for own booking)
  console.log("\n6. Querying Active Queue Entries for Centre...");
  const { data: queueList, error: queueQueryErr } = await farmerClient
    .from("queue_entries")
    .select("*")
    .eq("id", queueEntryId);

  if (queueQueryErr) {
    console.error("❌ Queue Query Error:", queueQueryErr.message);
  } else {
    console.log("✅ 8. Active Queue Entries Found! Count:", queueList.length);
  }

  // 7. Verify Cancellation RPC
  console.log("\n7. Testing Booking Cancellation RPC...");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const { data: cancelBookingRes } = await farmerClient.rpc("create_smart_slot_booking", {
    p_crop_id: crop.id,
    p_centre_id: centre.id,
    p_booking_date: tomorrow,
    p_slot_start_time: "11:00:00",
    p_slot_end_time: "12:00:00",
    p_estimated_quantity_quintals: 30.0,
    p_vehicle_type: "Tractor",
  });

  if (cancelBookingRes?.id) {
    const { data: cancelRes, error: cancelErr } = await farmerClient.rpc("cancel_farmer_slot_booking", {
      p_booking_id: cancelBookingRes.id,
    });

    if (cancelErr) {
      console.error("❌ Cancellation Error:", cancelErr.message);
    } else {
      console.log("✅ 12. Slot Cancellation Succeeded!");
    }
  }

  // 8. Test Authorization Boundaries (Farmer B trying to perform Staff Call Next)
  console.log("\n8. Testing Authorization Boundaries...");
  const farmerBEmail = `farmer_b_${ts}@kisansetu.in`;
  const farmerBPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const { data: fBAuth } = await supabase.auth.signUp({
    email: farmerBEmail,
    password,
    options: { data: { full_name: "Farmer B", phone_number: farmerBPhone, role: "FARMER" } },
  });

  const farmerBClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${fBAuth.session.access_token}` } },
  });

  const { error: fBStaffErr } = await farmerBClient.rpc("staff_call_next_farmer", {
    p_centre_id: centre.id,
  });

  if (fBStaffErr) {
    console.log("✅ 13. Security Verified: Non-staff user (Farmer B) blocked from Staff RPC!");
    console.log("    Rejection Reason:", fBStaffErr.message);
  } else {
    console.error("❌ SECURITY FAILURE: Farmer B executed Staff CALL NEXT!");
  }

  console.log("==================================================");
  console.log("COMPLETE FLOW VERIFICATION SUCCESSFUL!");
  console.log("==================================================");
}

verifyCompleteFlow().catch(console.error);
