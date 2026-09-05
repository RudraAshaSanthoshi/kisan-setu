import { createClient } from '@supabase/supabase-js';

const url = "https://taizpyvyqfgjgdzemiyh.supabase.co";
const key = "sb_publishable_usa5Eu7sUH0fUrNnktdaTg_iKQgjbUf";

const supabase = createClient(url, key);

async function testConnection() {
  console.log("Testing connection to Supabase:", url);
  try {
    const { data: crops, error: cropsErr } = await supabase.from('crops').select('*');
    if (cropsErr) {
      console.error("Crops query error:", cropsErr);
    } else {
      console.log("Successfully fetched crops. Count:", crops?.length);
      console.log("Sample crop:", crops?.[0]?.crop_code, crops?.[0]?.name_en);
    }

    const { data: centres, error: centresErr } = await supabase.from('procurement_centres').select('*');
    if (centresErr) {
      console.error("Centres query error:", centresErr);
    } else {
      console.log("Successfully fetched procurement_centres. Count:", centres?.length);
      console.log("Sample centre:", centres?.[0]?.centre_code, centres?.[0]?.name);
    }
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

testConnection();
