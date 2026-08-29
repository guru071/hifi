import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { listActiveProducts, listAdminProducts } from '@/lib/services/catalog';
import { requireAdminRequest } from '@/lib/guards';
import { logAudit } from '@/lib/services/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('includeInactive') === 'true') {
      const { response } = await requireAdminRequest(request);
      if (response) return response;
      const products = await listAdminProducts();
      return NextResponse.json({ products }, { status: 200 });
    }
    const products = await listActiveProducts();
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient();

  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const body = await request.json();
    const { title, subtitle, description, base_price, image_url, category, category_id, delivery_fee } = body;

    if (!title || typeof title !== 'string' || typeof base_price !== 'number' || base_price < 0) {
      return NextResponse.json({ error: 'title and a non-negative base_price are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        title,
        subtitle: subtitle ?? null,
        description: description ?? null,
        base_price,
        image_url: image_url ?? null,
        category: category ?? null,
        category_id: category_id ?? null,
        delivery_fee: delivery_fee ?? 10,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'product.created',
        entityType: 'product',
        entityId: data.id,
        after: { title, base_price },
      },
      supabase
    );

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    console.error('Server error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}