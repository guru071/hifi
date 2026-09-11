import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { listActiveProducts, listAdminProducts } from '@/lib/services/catalog';
import { requireAdminRequest } from '@/lib/guards';
import { logAudit } from '@/lib/services/audit';
import { notifyCustomersNewProduct } from '@/lib/services/whatsapp-notifications';

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

    
    // Create variants
    let variantsToInsert = [];
    
    if (body.custom_variants && Array.isArray(body.custom_variants) && body.custom_variants.length > 0) {
      // Explicit variants array from the new UI
      for (const v of body.custom_variants) {
        let variantColorStr = v.color || 'Standard';
        if (v.image_url) {
          variantColorStr = `${variantColorStr} [IMG:${v.image_url}]`;
        }
        variantsToInsert.push({
          product_id: data.id,
          color: variantColorStr,
          size: v.size || 'One Size',
          sku: `${title.substring(0, 3).toUpperCase()}-${(v.color||'STD').substring(0, 3).toUpperCase()}-${v.size||'OS'}`,
          inventory_count: Number(v.stock) || 0,
          price_adjustment: 0
        });
      }
    } else {
      // Fallback cross-multiplication for backwards compatibility
      const colorsList = (body.colors as string) ? (body.colors as string).split(',').map((s: string) => s.trim()).filter(Boolean) : ['Standard'];
      const sizesList = (body.sizes as string) ? (body.sizes as string).split(',').map((s: string) => s.trim()).filter(Boolean) : ['One Size'];
  
      for (const c of colorsList) {
        const isFirstColor = c === colorsList[0];
        const variantColorStr = (isFirstColor && data.image_url) ? `${c} [IMG:${data.image_url}]` : c;
        
        for (const s of sizesList) {
          variantsToInsert.push({
            product_id: data.id,
            color: variantColorStr,
            size: s,
            sku: `${title.substring(0, 3).toUpperCase()}-${c.substring(0, 3).toUpperCase()}-${s}`,
            inventory_count: 10,
            price_adjustment: 0
          });
        }
      }
    }
    
    if (variantsToInsert.length > 0) {
      const { error: variantError } = await supabase.from('product_variants').insert(variantsToInsert);
      if (variantError) console.error('Failed to create variants:', variantError);
    }

    // Trigger WhatsApp notification for new product (fire and forget)
    notifyCustomersNewProduct(data).catch(err => {
      console.error('Failed to notify customers of new product:', err);
    });

    return NextResponse.json({ product: data, colorsList }, { status: 201 });
  } catch (error) {
    console.error('Server error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}