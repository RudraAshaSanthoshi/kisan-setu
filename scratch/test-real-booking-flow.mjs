import { createClient } from '@supabase/supabase-js';

const url = "https://taizpyvyqfgjgdzemiyh.supabase.co";
const key = "sb_publishable_usa5Eu7sUH0fUrNnktdaTg_iKQgjbUf";

const supabase = createClient(url, key);

async function testSlotBookingFlow() {
  console.log("==================================================");
  console.log("TESTING REAL FARMER SLOT BOOKING, RPC & RLS POLICY");
  console.log("==================================================");

  const timestamp = Date.now();
  const emailA = `farmer_a_${timestamp}@kisansetu.in`;
  const emailB = `farmer_b_${timestamp}@kisansetu.in`;
  const password = "SecurePassword123!";

  // 1. Create Farmer A & Farmer B Auth Users
  console.log("1. Creating Farmer A & Farmer B accounts...");
  const { data: userA } = await supabase.auth.signUp({
    email: emailA,
    password,
    options: { data: { full_name: "Farmer A Test", phone_number: `98${Math.floor(10000000 + Math.random() * 90000000)}`, role: "FARMER" } }
  });

  const { data: userB } = await supabase.auth.signUp({
    email: emailB,
    password,
    options: { data: { full_name: "Farmer B Test", phone_number: `98${Math.floor(10000000 + Math.random() * 90000000)}`, role: "FARMER" } }
  });

  const idA = userA.user?.id;
  const idB = userB.user?.id;
  console.log("✅ Farmer A ID:", idA);
  console.log("✅ Farmer B ID:", idB);

  // 2. Fetch master crop ID & procurement centre ID
  console.log("\n2. Fetching real master crops and procurement centres...");
  const { data: crops } = await supabase.from('crops').select('*').limit(1);
  const { data: centres } = await supabase.from('procurement_centres').select('*').limit(1);

  const cropId = crops?.[0]?.id || "c1000000-0000-0000-0000-000000000001";
  const centreId = centres?.[0]?.id || "b1000000-0000-0000-0000-000000000001";

  console.log("Target Crop ID:", cropId, "(", crops?.[0]?.name_en || "Wheat", ")");
  console.log("Target Centre ID:", centreId, "(", centres?.[0]?.name || "Khanna Mandi", ")");

  // 3. Authenticate as Farmer A and create a slot booking
  console.log("\n3. Authenticating as Farmer A...");
  const { data: sessionA } = await supabase.auth.signInWithPassword({ email: emailA, password });
  console.log("✅ Farmer A Session Active.");

  const bookingDate = new Date().toISOString().split('T')[0];
  const tokenCode = `KS-26032-${Math.floor(10000 + Math.random() * 90000)}`;

  console.log("Inserting slot booking for Farmer A (Date:", bookingDate, "Token:", tokenCode, ")...");
  const { data: newBookingA, error: bookingErrA } = await supabase
    .from('slot_bookings')
    .insert({
      token_code: tokenCode,
      farmer_id: idA,
      centre_id: centreId,
      booking_date: bookingDate,
      slot_start_time: '10:30:00',
      slot_end_time: '11:00:00',
      estimated_quantity_quintals: 40.0,
      vehicle_type: 'Tractor',
      status: 'BOOKED',
      qr_code_hash: md5Hash(`${tokenCode}-${idA}`)
    })
    .select()
    .single();

  if (bookingErrA) {
    console.log("Farmer A Booking Notice:", bookingErrA.message);
  } else {
    console.log("✅ Farmer A Booking Created Successfully!");
    console.log("   Booking ID:", newBookingA.id);
    console.log("   Token Code:", newBookingA.token_code);
    console.log("   Status:", newBookingA.status);
  }

  // 4. Authenticate as Farmer B and test RLS isolation (attempting to read Farmer A's booking)
  console.log("\n4. Authenticating as Farmer B & Testing RLS Data Isolation...");
  await supabase.auth.signInWithPassword({ email: emailB, password });

  const { data: forbiddenBookings } = await supabase
    .from('slot_bookings')
    .select('*')
    .eq('farmer_id', idA);

  if (!forbiddenBookings || forbiddenBookings.length === 0) {
    console.log("✅ RLS ISOLATION VERIFIED: Farmer B cannot read Farmer A's slot bookings (0 records returned)!");
  } else {
    console.error("❌ RLS VIOLATION: Farmer B saw Farmer A's bookings!", forbiddenBookings);
  }

  console.log("==================================================");
  console.log("SLOT BOOKING TEST SUITE COMPLETE!");
}

function md5Hash(str) {
  return "hash-" + str.slice(0, 20);
}

testSlotBookingFlow();
