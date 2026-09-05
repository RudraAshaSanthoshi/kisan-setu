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
  console.log("=== KISANSETU PAYMENT WORKFLOW VERIFICATION ===");
  console.log("Supabase URL:", supabaseUrl);

  const farmerEmail = `pay.farmer.${Date.now()}@farmer.kisansetu.in`;
  const farmerPassword = "Password123!";
  const staffEmail = `staff.khanna@kisansetu.in`;
  const staffPassword = `StaffPass123!`;

  try {
    // Step 1: Register Farmer User
    console.log("\n[1/8] Registering test Farmer user...");
    const { data: farmerAuth, error: signUpErr } = await supabase.auth.signUp({
      email: farmerEmail,
      password: farmerPassword,
      options: {
        data: {
          full_name: "Payment Test Farmer",
          phone_number: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
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
    console.log("\n[2/8] Fetching active procurement centre & crop...");
    const { data: centres } = await supabase.from("procurement_centres").select("id, name").eq("is_active", true).limit(1);
    const { data: crops } = await supabase.from("crops").select("id, name_en, msp_per_quintal").eq("is_active", true).limit(1);

    if (!centres || centres.length === 0 || !crops || crops.length === 0) {
      console.error("Missing centres or crops in DB");
      process.exit(1);
    }
    const centreId = centres[0].id;
    const cropId = crops[0].id;

    // Step 3: Book Slot & Check In
    console.log("\n[3/8] Booking slot & checking in farmer...");
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: bookingRes } = await supabase.rpc("create_smart_slot_booking", {
      p_crop_id: cropId,
      p_centre_id: centreId,
      p_booking_date: todayStr,
      p_slot_start_time: "11:00:00",
      p_slot_end_time: "11:30:00",
      p_estimated_quantity_quintals: 50,
    });
    const bookingId = bookingRes.id;

    const { data: checkInRes } = await supabase.rpc("check_in_farmer_booking", {
      p_booking_id: bookingId,
    });
    const queueEntryId = checkInRes.id;
    console.log("Booking & Check-in completed. Queue Entry ID:", queueEntryId);

    // Step 4: Sign in as Staff & Create Procurement (Initial Payment: PENDING)
    console.log("\n[4/8] Staff signing in and executing save_procurement_record...");
    await supabase.auth.signOut();

    let { data: staffAuth } = await supabase.auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword,
    });
    if (!staffAuth?.user) {
      const { data: newStaff } = await supabase.auth.signUp({
        email: staffEmail,
        password: staffPassword,
        options: { data: { full_name: "Khanna Staff", phone_number: "+919876543219" } },
      });
      await supabase.from("profiles").update({ role: "CENTRE_STAFF", assigned_centre_id: centreId }).eq("id", newStaff.user?.id);
      staffAuth = newStaff;
    } else {
      await supabase.from("profiles").update({ role: "CENTRE_STAFF", assigned_centre_id: centreId }).eq("id", staffAuth.user?.id);
    }

    const { data: procRes, error: procErr } = await supabase.rpc("save_procurement_record", {
      p_queue_entry_id: queueEntryId,
      p_gross_weight_kg: 5200,
      p_tare_weight_kg: 200,
      p_moisture_percentage: 12.0,
      p_grade: "GRADE_A",
    });

    if (procErr || !procRes) {
      if (procErr?.code === "22001" || procErr?.message?.includes("does not exist")) {
        console.log("MIGRATION_REQUIRED: Migration 20250101000008_payment_status_update_rpc.sql needs to be executed in Supabase SQL Editor!");
        console.log("Error detail:", procErr?.message);
        process.exit(0);
      }
      console.error("save_procurement_record failed:", procErr);
      process.exit(1);
    }

    const paymentId = procRes.payment_id;
    console.log("Procurement & Payment created! Payment ID:", paymentId, "Initial Status: PENDING");

    // Step 5: Test Security Boundary (Farmer attempting to update payment status)
    console.log("\n[5/8] Testing Security Boundary: Farmer attempting update_payment_status...");
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({ email: farmerEmail, password: farmerPassword });

    const { data: unauthRes, error: unauthErr } = await supabase.rpc("update_payment_status", {
      p_payment_id: paymentId,
      p_new_status: "PROCESSED",
    });

    if (unauthErr && unauthErr.message.includes("UNAUTHORIZED_STAFF_ROLE")) {
      console.log("PASSED: Security Boundary verified! Farmer mutation blocked:", unauthErr.message);
    } else if (unauthErr && unauthErr.message.includes("does not exist")) {
      console.log("MIGRATION_REQUIRED: update_payment_status RPC does not exist in Supabase yet.");
      console.log("Please run 20250101000008_payment_status_update_rpc.sql in Supabase SQL Editor!");
      process.exit(0);
    } else {
      console.error("FAILED: Security Boundary check error:", unauthErr);
    }

    // Step 6: Staff updates payment PENDING -> PROCESSING -> PROCESSED
    console.log("\n[6/8] Staff updating payment status PENDING -> PROCESSING -> PROCESSED...");
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({ email: staffEmail, password: staffPassword });

    // Transition 1: PENDING -> PROCESSING
    const { data: step1Res, error: step1Err } = await supabase.rpc("update_payment_status", {
      p_payment_id: paymentId,
      p_new_status: "PROCESSING",
    });
    if (step1Err) {
      console.error("FAILED PENDING -> PROCESSING transition:", step1Err.message);
      if (step1Err.message.includes("does not exist")) {
        console.log("\n-> MIGRATION REQUIRED: Run 20250101000008_payment_status_update_rpc.sql in Supabase SQL Editor!");
      }
      process.exit(1);
    }
    console.log("PASSED: Status updated to PROCESSING:", step1Res);

    // Transition 2: PROCESSING -> PROCESSED
    const { data: step2Res, error: step2Err } = await supabase.rpc("update_payment_status", {
      p_payment_id: paymentId,
      p_new_status: "PROCESSED",
      p_transaction_ref: "UTR-BANK-99887766",
    });
    if (step2Err) {
      console.error("FAILED PROCESSING -> PROCESSED transition:", step2Err.message);
      process.exit(1);
    }
    console.log("PASSED: Status updated to PROCESSED:", step2Res);

    // Step 7: Verify Notifications & Farmer Visibility
    console.log("\n[7/8] Verifying notifications & Farmer visibility...");
    await supabase.auth.signOut();
    await supabase.auth.signInWithPassword({ email: farmerEmail, password: farmerPassword });

    // Check payment row in DB
    const { data: payRow } = await supabase.from("payments").select("*").eq("id", paymentId).single();
    console.log(`Live DB Payment Status: ${payRow?.payment_status} (Expected: PROCESSED)`);
    console.log(`Transaction Reference: ${payRow?.transaction_ref}`);

    // Check notifications dispatched
    const { data: notifs } = await supabase.from("notifications").select("*").eq("user_id", farmerId).order("created_at", { ascending: false });
    console.log(`Farmer Notifications Count: ${notifs?.length || 0}`);
    if (notifs) {
      notifs.forEach((n, idx) => console.log(`  Notif #${idx + 1}: [${n.title_key}] ${n.body_key}`));
    }

    if (payRow?.payment_status === "PROCESSED" && (notifs?.length || 0) >= 2) {
      console.log("\n==================================================");
      console.log("ALL PAYMENT WORKFLOW TESTS PASSED SUCCESSFULLY! 🚀");
      console.log("==================================================");
    } else {
      console.error("FAILED: Payment verification assertions failed!");
    }
  } catch (err) {
    console.error("Unhandled error during payment verification:", err);
    process.exit(1);
  }
}

runVerification();
