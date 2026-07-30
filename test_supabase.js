const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  console.log("Testing fetch from menu_items...");
  const { data, error } = await supabase.from('menu_items').select('*');
  if (error) {
    console.error("Error details:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success. Row count:", data.length);
  }
}

testFetch();
