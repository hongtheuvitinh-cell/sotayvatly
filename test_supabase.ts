import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://hilmbnyfdcxpowwyyjif.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Supabase URL:", supabaseUrl);
  
  // 1. Fetch formulas from any lesson
  const { data, error } = await supabase.from('formulas').select('*').limit(5);
  if (error) {
    console.error("Error fetching formulas:", error);
    return;
  }
  
  console.log("Formulas rows schema study:");
  console.log(JSON.stringify(data, null, 2));
}

test();
