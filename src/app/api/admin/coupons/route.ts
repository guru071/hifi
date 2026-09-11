import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/guards';

export async function GET(request: Request) {
  const supabase = createServerClient();
  try {
    const { response } = await requireAdminRequest(request);
    if (response) return response;

    const { data } = await supabase.from('delivery_settings').select('*').eq('setting_key', 'discount_coupons').maybeSingle();
    return NextResponse.json({ coupons: data?.setting_value || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient();
  try {
    const { response } = await requireAdminRequest(request);
    if (response) return response;

    const { coupons } = await request.json();
    
    // UPSERT discount_coupons
    const { error } = await supabase.from('delivery_settings').upsert({
      setting_key: 'discount_coupons',
      setting_value: coupons,
      updated_at: new Date().toISOString()
    }, { onConflict: 'setting_key' });

    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
