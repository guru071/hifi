const fs = require('fs');
const envVars = fs.readFileSync('.env', 'utf8').split('\n');
const env = {};
envVars.forEach(line => {
  const match = line.match(/^([^#][^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: "ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;" });
  if (error) {
    console.error("RPC failed, we need to create the column another way.", error);
  } else {
    console.log("Success:", data);
  }
}
run();
