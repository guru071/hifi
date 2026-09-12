import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const totalParam = url.searchParams.get('total');

  if (!code || !totalParam) {
    return NextResponse.json({ error: 'Missing code or total' }, { status: 400 });
  }

  const total = Number(totalParam);
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('delivery_settings')
      .select('setting_value')
      .eq('setting_key', 'discount_coupons')
      .single();

    if (error || !data || !data.setting_value) {
      return NextResponse.json({ error: 'Invalid coupon' }, { status: 404 });
    }

    const coupons = data.setting_value as any[];
    const coupon = coupons.find((c: any) => c.code.toUpperCase() === code.toUpperCase());

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 });
    }

    if (total < Number(coupon.min_order || 0)) {
      return NextResponse.json({ error: `Minimum order amount is ₹${coupon.min_order} for this coupon` }, { status: 400 });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (total * Number(coupon.value)) / 100;
    } else {
      discount = Number(coupon.value);
    }

    return NextResponse.json({ discount, code: coupon.code });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
