import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { listActiveProducts, listAdminProducts } from '@/lib/services/catalog';
import { requireAdminRequest } from '@/lib/guards';
import { logAudit } from '@/lib/services/audit';

const COMMON_COLORS = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'brown', 'navy', 'maroon', 'gold', 'silver'];

function extractColors(text: string): string[] {
  if (!text) return [];
  const words = text.toLowerCase().split(/[\s,.-]+/);
  return COMMON_COLORS.filter(color => words.includes(color));
}

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

    // Auto-detect colors and create variants
    const textToSearch = `${title} ${description || ''}`;
    const detectedColors = Array.from(new Set(extractColors(textToSearch)));

    if (detectedColors.length > 0) {
      const variantsToInsert = detectedColors.map(color => ({
        product_id: data.id,
        color: color.charAt(0).toUpperCase() + color.slice(1),
        size: 'One Size',
        sku: `${title.substring(0, 3).toUpperCase()}-${color.substring(0, 3).toUpperCase()}`,
        inventory_count: 100,
        price_adjustment: 0
      }));
      
      const { error: variantError } = await supabase.from('product_variants').insert(variantsToInsert);
      if (variantError) console.error('Failed to auto-create variants:', variantError);
    }

    return NextResponse.json({ product: data, detectedColors }, { status: 201 });
  } catch (error) {
    console.error('Server error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}