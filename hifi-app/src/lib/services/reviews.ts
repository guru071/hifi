import { createServerClient } from '@/lib/supabase/server';
import type { ItemSnapshot } from '@/lib/supabase/rows';

export class ReviewValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Submit a review. Validates that the user has actually purchased the product
 * (via a delivered/paid order whose items reference that product), so guests
 * and non-purchasers cannot leave reviews.
 */
export async function submitReview({
  profileId,
  productId,
  rating,
  comment,
  orderId,
}: {
  profileId: string;
  productId: string;
  rating: number;
  comment?: string;
  orderId?: string;
}) {
  const supabase = createServerClient();

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new ReviewValidationError('Rating must be between 1 and 5', 400);
  }

  const product = await supabase.from('products').select('id').eq('id', productId).maybeSingle();
  if (!product.data) throw new ReviewValidationError('Product not found', 404);

  // Find a qualifying order: paid/delivered, contains this product
  let query = supabase
    .from('orders')
    .select('id, status, items_snapshot')
    .eq('user_id', profileId)
    .in('status', ['paid', 'processing', 'shipped', 'delivered'])
    .limit(10);

  if (orderId) query = query.eq('id', orderId);

  const { data: orders } = await query;

  const qualifying = (orders ?? []).find((o) =>
    Array.isArray(o.items_snapshot)
      ? (o.items_snapshot as unknown as ItemSnapshot[]).some((s) => s.product_id === productId)
      : false
  );

  if (!qualifying) {
    throw new ReviewValidationError('You can only review products you have purchased', 403);
  }

  // Prevent duplicate reviews per user+product
  const { data: existing } = await supabase
    .from('product_reviews')
    .select('id')
    .eq('user_id', profileId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('product_reviews')
      .update({ rating, comment: comment ?? null, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw new ReviewValidationError(`Failed to update review: ${error.message}`, 500);
    return { id: existing.id, updated: true };
  }

  const { data, error } = await supabase
    .from('product_reviews')
    .insert({
      product_id: productId,
      user_id: profileId,
      order_id: qualifying.id,
      rating,
      comment: comment ?? null,
      is_visible: true,
    })
    .select()
    .single();

  if (error) throw new ReviewValidationError(`Failed to submit review: ${error.message}`, 500);
  return { id: data.id, updated: false };
}