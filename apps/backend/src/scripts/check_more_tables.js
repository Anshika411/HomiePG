require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking tables using Supabase JS client...");

  const tables = ["staff", "staff_attendance", "expenses", "bookings"];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(1);
      if (error) {
        console.log(`❌ Table ${table} error: ${error.message}`);
      } else {
        console.log(`✅ Table ${table} exists! Record count: ${data.length}`);
      }
    } catch (e) {
      console.log(`❌ Table ${table} exception: ${e.message}`);
    }
  }
}

check();
