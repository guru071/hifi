import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/guards';
import { logAudit } from '@/lib/services/audit';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const params = await context.params;

  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const body = await request.json();
    const { color, size, inventory_count, price_adjustment } = body;

    if (!color || !size) {
      return NextResponse.json({ error: 'Color and size are required' }, { status: 400 });
    }

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('title')
      .eq('id', params.id)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Generate SKU based on product title, color, and size
    const sku = `${product.title.substring(0, 3).toUpperCase()}-${color.split('[IMG:')[0].trim().substring(0, 3).toUpperCase()}-${size.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: params.id,
        color,
        size,
        sku,
        inventory_count: inventory_count ?? 0,
        price_adjustment: price_adjustment ?? 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating variant:', error);
      return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'product.variant.created',
        entityType: 'product',
        entityId: params.id,
        after: variant,
      },
      supabase
    );

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    console.error('Server error creating product variant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
