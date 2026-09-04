import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getProductById } from '@/lib/services/catalog';
import { requireAdminRequest } from '@/lib/guards';
import { logAudit } from '@/lib/services/audit';

interface VariantUpdateBody {
  id: string;
  inventory_count?: number;
  price_adjustment?: number;
}

interface ProductVariantsBody {
  variants?: VariantUpdateBody[];
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;

  try {
    const product = await getProductById(params.id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const params = await context.params;

  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    const allowed = [
      'title', 'subtitle', 'description', 'base_price', 'image_url',
      'category', 'category_id', 'is_active', 'delivery_fee',
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    // Fetch before-state for audit
    const { data: before } = await supabase.from('products').select('*').eq('id', params.id).maybeSingle();

    const { error } = await supabase.from('products').update(updateData as never).eq('id', params.id);
    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'product.updated',
        entityType: 'product',
        entityId: params.id,
        before: before ?? undefined,
        after: updateData,
      },
      supabase
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error updating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const params = await context.params;

  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const body = (await request.json()) as ProductVariantsBody;
    const { variants } = body;

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: 'variants array is required' }, { status: 400 });
    }

    // Verify variants belong to this product
    const { data: owned, error: checkError } = await supabase
      .from('product_variants')
      .select('id')
      .in('id', variants.map((v) => v.id))
      .eq('product_id', params.id);
    if (checkError || (owned || []).length !== variants.length) {
      return NextResponse.json({ error: 'One or more variants do not belong to this product' }, { status: 400 });
    }

    for (const v of variants) {
      if (!v.id) return NextResponse.json({ error: 'Each variant must include an id' }, { status: 400 });
      const patch: Record<string, unknown> = {};
      if (v.inventory_count !== undefined) {
        if (typeof v.inventory_count !== 'number' || v.inventory_count < 0) {
          return NextResponse.json({ error: 'inventory_count must be a non-negative number' }, { status: 400 });
        }
        patch.inventory_count = v.inventory_count;
      }
      if (v.price_adjustment !== undefined) {
        if (typeof v.price_adjustment !== 'number') {
          return NextResponse.json({ error: 'price_adjustment must be a number' }, { status: 400 });
        }
        patch.price_adjustment = v.price_adjustment;
      }
      if (Object.keys(patch).length === 0) continue;
      const { error } = await supabase.from('product_variants').update(patch as never).eq('id', v.id);
      if (error) {
        console.error('Error updating variant:', error);
        return NextResponse.json({ error: `Failed to update variant ${v.id}` }, { status: 500 });
      }
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'product.variants.updated',
        entityType: 'product',
        entityId: params.id,
        after: { variants: variants.map((v) => ({ id: v.id, inventory_count: v.inventory_count, price_adjustment: v.price_adjustment })) },
      },
      supabase
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error updating product variants:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const params = await context.params;

  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    // Fetch the product first so we can clean up its image from storage
    const { data: product } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', params.id)
      .maybeSingle();

    const { error } = await supabase.from('products').delete().eq('id', params.id);
    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    // Delete the image from Supabase storage if it was uploaded there
    if (product?.image_url) {
      try {
        const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/`;
        if (product.image_url.startsWith(storageBase)) {
          const fileName = product.image_url.replace(storageBase, '');
          const { error: storageError } = await supabase.storage
            .from('products')
            .remove([fileName]);
          if (storageError) {
            console.warn('Could not delete image from storage:', storageError.message);
          }
        }
      } catch (imgErr) {
        console.warn('Image cleanup failed (non-fatal):', imgErr);
      }
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'product.deleted',
        entityType: 'product',
        entityId: params.id,
      },
      supabase
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error deleting product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}