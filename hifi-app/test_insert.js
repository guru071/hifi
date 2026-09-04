const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('users').insert({
    email: 'test_insert_' + Date.now() + '@example.com',
    full_name: 'Test',
    role: 'customer',
  }).select();
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
