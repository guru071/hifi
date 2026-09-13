import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  try {
    const { data, error } = await supabase
      .from('delivery_settings')
      .select('setting_value')
      .eq('setting_key', 'discount_coupons')
      .single();

    if (error || !data || !data.setting_value) {
      return NextResponse.json({ coupons: [] }, { status: 200 });
    }

    const coupons = data.setting_value as any[];
    // Only return active coupons and hide any sensitive internal notes if any exist
    const activeCoupons = coupons
      .filter((c: any) => c.active)
      .map((c: any) => ({
        code: c.code,
        type: c.type,
        value: c.value,
        min_order: c.min_order
      }));

    return NextResponse.json({ coupons: activeCoupons }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
