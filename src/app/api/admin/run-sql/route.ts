import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { error } = await supabase.rpc('exec_sql', { sql: "ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;" });
  return NextResponse.json({ error });
}
