import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/guards';

export async function GET(request: Request) {
  const supabase = createServerClient();
  try {
    const { data, error } = await supabase
      .from('delivery_settings')
      .select('setting_value')
      .eq('setting_key', 'home_banners')
      .maybeSingle();

    if (error) throw error;
    
    const banners = data?.setting_value || [];
    return NextResponse.json({ banners }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching banners:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient();
  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const body = await request.json();
    const { banners } = body;

    if (!Array.isArray(banners)) {
      return NextResponse.json({ error: 'banners must be an array' }, { status: 400 });
    }

    const { error } = await supabase.from('delivery_settings').upsert({
      setting_key: 'home_banners',
      setting_value: banners
    }, { onConflict: 'setting_key' });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error saving banners:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
