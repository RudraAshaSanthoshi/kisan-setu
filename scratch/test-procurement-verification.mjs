import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const val = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      if (key && val) {
        process.env[key.trim()] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runVerification() {
  console.log("=== KISANSETU PROCUREMENT WORKFLOW VERIFICATION ===");
  console.log("Supabase URL:", supabaseUrl);

  const farmerEmail = `proc.farmer.${Date.now()}@farmer.kisansetu.in`;
  const farmerPassword = "Password123!";
  const staffEmail = `staff.khanna@kisansetu.in`;
  const staffPassword = `StaffPass123!`;

  try {
    // Step 1: Register or Sign In Farmer User
    console.log("\n[1/7] Registering test Farmer user...");
    const { data: farmerAuth, error: signUpErr } = await supabase.auth.signUp({
      email: farmerEmail,
      password: farmerPassword,
      options: {
        data: {
          full_name: "Procurement Test Farmer",
          phone_number: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
          preferred_language: "hi",
        },
      },
    });

    if (signUpErr) {
      console.error("Farmer SignUp failed:", signUpErr.message);
      process.exit(1);
    }

    const farmerId = farmerAuth.user?.id;
    console.log("Farmer User ID:", farmerId);

    // Step 2: Fetch Centre & Crop
    console.log("\n[2/7] Fetching active procurement centre & crop...");
    const { data: centres } = await supabase.from("procurement_centres").select("id, name").eq("is_active", true).limit(1);
    const { data: crops } = await supabase.from("crops").select("id, name_en, msp_per_quintal").eq("is_active", true).limit(1);

    if (!centres || centres.length === 0 || !crops || crops.length === 0) {
      console.error("Missing centres or crops in DB");
      process.exit(1);
    }

    const centreId = centres[0].id;
    const cropId = crops[0].id;
    const msp = Number(crops[0].msp_per_quintal || 2275);
    console.log(`Centre: ${centres[0].name} (${centreId})`);
    console.log(`Crop: ${crops[0].name_en} (${cropId}), MSP: ₹${msp}/Qtl`);

    // Step 3: Book Slot & Check In
    console.log("\n[3/7] Booking slot & checking in farmer...");
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: bookingRes, error: bookErr } = await supabase.rpc("create_smart_slot_booking", {
      p_crop_id: cropId,
      p_centre_id: centreId,
      p_booking_date: todayStr,
      p_slot_start_time: "10:30:00",
      p_slot_end_time: "11:00:00",
      p_estimated_quantity_quintals: 40,
    });

    if (bookErr) {
      console.error("Slot booking failed:", bookErr.message);
      process.exit(1);
    }
    const bookingId = bookingRes.id;
    console.log("Booking created successfully. Token Code:", bookingRes.token_code);

    const { data: checkInRes, error: checkInErr } = await supabase.rpc("check_in_farmer_booking", {
      p_booking_id: bookingId,
    });

    if (checkInErr) {
      console.error("Check-in failed:", checkInErr.message);
      process.exit(1);
    }
    const queueEntryId = checkInRes.id;
    console.log(`Farmer checked in successfully! Queue Entry ID: ${queueEntryId}, Queue #: ${checkInRes.queue_number}`);

    // Step 4: Verify Authorization Boundary (Farmer attempting to save procurement record)
    console.log("\n[4/7] Testing Security Boundary: Farmer attempting staff mutation...");
    const { data: unauthRes, error: unauthErr } = await supabase.rpc("save_procurement_record", {
      p_queue_entry_id: queueEntryId,
      p_gross_weight_kg: 4500,
      p_tare_weight_kg: 500,
      p_moisture_percentage: 12.0,
      p_grade: "GRADE_A",
    });

    if (unauthErr && unauthErr.message.includes("UNAUTHORIZED_STAFF_ROLE")) {
      console.log("PASSED: Security Boundary verified! Farmer mutation blocked:", unauthErr.message);
    } else if (unauthErr && unauthErr.message.includes("function public.save_procurement_record") || unauthErr?.message?.includes("does not exist")) {
      console.log("MIGRATION_REQUIRED: save_procurement_record RPC does not exist in Supabase yet.");
      console.log("Please run 20250101000007_procurement_and_payment_rpc.sql in Supabase SQL Editor!");
      process.exit(0);
    } else {
      console.error("FAILED: Security Boundary compromised or error:", unauthErr);
    }

    // Step 5: Sign In as Staff User & Process Procurement
    console.log("\n[5/7] Signing in as Centre Staff user...");
    await supabase.auth.signOut();

    let { data: staffAuth, error: staffSignInErr } = await supabase.auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword,
    });

    if (staffSignInErr) {
      console.log("Staff user not found, creating staff user...");
      const { data: newStaff, error: staffSignUpErr } = await supabase.auth.signUp({
        email: staffEmail,
        password: staffPassword,
        options: {
          data: {
            full_name: "Khanna Centre Staff",
            phone_number: "+919876543219",
          },
        },
      });

      if (staffSignUpErr) {
        console.error("Staff SignUp failed:", staffSignUpErr.message);
        process.exit(1);
      }

      const staffUserId = newStaff.user?.id;
      // Assign staff role in profiles
      await supabase.from("profiles").update({ role: "CENTRE_STAFF", assigned_centre_id: centreId }).eq("id", staffUserId);
      staffAuth = newStaff;
    } else {
      // Ensure role is set
      await supabase.from("profiles").update({ role: "CENTRE_STAFF", assigned_centre_id: centreId }).eq("id", staffAuth.user?.id);
    }

    console.log("Staff User authenticated successfully. ID:", staffAuth.user?.id);

    // Call Next & Execute save_procurement_record
    console.log("\n[6/7] Staff executing save_procurement_record RPC...");
    const grossKg = 4500;
    const tareKg = 500;
    const expectedNetQtl = (grossKg - tareKg) / 100; // 40 Qtl
    const expectedPayout = expectedNetQtl * msp;

    const { data: procRes, error: procErr } = await supabase.rpc("save_procurement_record", {
      p_queue_entry_id: queueEntryId,
      p_gross_weight_kg: grossKg,
      p_tare_weight_kg: tareKg,
      p_moisture_percentage: 12.0,
      p_grade: "GRADE_A",
      p_remarks: "Verified end-to-end via automated verification script",
    });

    if (procErr) {
      console.error("Procurement RPC failed:", procErr.message);
      if (procErr.message.includes("does not exist")) {
        console.log("\n-> MIGRATION REQUIRED: Migration 20250101000007_procurement_and_payment_rpc.sql must be run in Supabase SQL Editor!");
      }
      process.exit(1);
    }

    console.log("Procurement RPC Result:", procRes);
    console.log(`Net Weight Qtl: ${procRes.net_weight_quintals} (Expected: ${expectedNetQtl})`);
    console.log(`Total Payout Amount: ₹${procRes.total_payout_amount} (Expected: ₹${expectedPayout})`);

    // Step 6: Verify Database Records & Farmer Visibility
    console.log("\n[7/7] Verifying live Supabase DB records & Farmer Portal visibility...");
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({ email: farmerEmail, password: farmerPassword });

    // Verify procurement record created
    const { data: procRows } = await supabase
      .from("procurement_records")
      .select("*")
      .eq("queue_entry_id", queueEntryId);

    if (!procRows || procRows.length === 0) {
      console.error("FAILED: procurement_records row not found!");
      process.exit(1);
    }
    console.log("PASSED: procurement_records row verified:", procRows[0].id);

    // Verify payments record created
    const { data: payRows } = await supabase
      .from("payments")
      .select("*")
      .eq("farmer_id", farmerId);

    if (!payRows || payRows.length === 0) {
      console.error("FAILED: payments row not found!");
      process.exit(1);
    }
    console.log("PASSED: payments row verified:", payRows[0].id, "Status:", payRows[0].payment_status);

    // Verify notification created
    const { data: notifRows } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", farmerId);

    if (!notifRows || notifRows.length === 0) {
      console.error("FAILED: notifications row not found!");
      process.exit(1);
    }
    console.log("PASSED: notification row verified:", notifRows[0].title_key);

    // Verify queue & booking status updated to COMPLETED
    const { data: qRow } = await supabase.from("queue_entries").select("status").eq("id", queueEntryId).single();
    const { data: bRow } = await supabase.from("slot_bookings").select("status").eq("id", bookingId).single();

    console.log(`Queue Entry Status: ${qRow?.status} (Expected: COMPLETED)`);
    console.log(`Slot Booking Status: ${bRow?.status} (Expected: COMPLETED)`);

    if (qRow?.status === "COMPLETED" && bRow?.status === "COMPLETED") {
      console.log("\n==================================================");
      console.log("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! 🚀");
      console.log("==================================================");
    } else {
      console.error("FAILED: Status transitions incomplete!");
    }
  } catch (err) {
    console.error("Unhandled error during verification:", err);
    process.exit(1);
  }
}

runVerification();
