import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/guards';

export async function POST(request: Request) {
  try {
    const { response } = await requireAdminRequest(request);
    if (response) return response;

    const body = await request.json();
    const { target, targetCategory, priceMin, priceMax, discountType, discountValue } = body;
    const value = Number(discountValue);

    if (!value || value <= 0) return NextResponse.json({ error: 'Invalid discount value' }, { status: 400 });

    const supabase = createServerClient();

    // 1. Fetch matching products
    let query = supabase.from('products').select('*').eq('is_active', true);

    if (target === 'category') {
      if (!targetCategory) return NextResponse.json({ error: 'Missing category' }, { status: 400 });
      query = query.eq('category_id', targetCategory);
    } else if (target === 'price') {
      if (priceMin) query = query.gte('base_price', Number(priceMin));
      if (priceMax) query = query.lte('base_price', Number(priceMax));
    }

    const { data: products, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!products || products.length === 0) return NextResponse.json({ updatedCount: 0 });

    let updatedCount = 0;

    // 2. Update each product
    for (const p of products) {
      const currentPrice = Number(p.base_price);
      let newPrice = currentPrice;
      let mrp = p.subtitle ? Number(p.subtitle) : currentPrice;
      
      // If the product doesn't have an MRP, set it to the current price before discounting
      if (isNaN(mrp) || mrp < currentPrice) {
        mrp = currentPrice;
      }

      if (discountType === 'percentage') {
        newPrice = currentPrice - (currentPrice * value / 100);
      } else {
        newPrice = currentPrice - value;
      }

      if (newPrice < 0) newPrice = 0;

      const { error: updateErr } = await supabase
        .from('products')
        .update({ 
          base_price: newPrice,
          subtitle: String(mrp) // Store MRP in subtitle column
        })
        .eq('id', p.id);
      
      if (!updateErr) updatedCount++;
    }

    return NextResponse.json({ updatedCount });
  } catch (error: any) {
    console.error('Server error in bulk offers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
