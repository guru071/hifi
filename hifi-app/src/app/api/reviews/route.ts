import { NextResponse } from 'next/server';
import { createServerClient, createRouteClient } from '@/lib/supabase/server';
import { submitReview, ReviewValidationError } from '@/lib/services/reviews';
import { getProfileByAuthId } from '@/lib/services/users';
import { requireAdminRequest } from '@/lib/guards';
import { logAudit } from '@/lib/services/audit';

export async function GET(request: Request) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  try {
    /** Public reads only approved (visible) reviews via RLS; admins may see all. */
    const { admin } = await requireAdminRequest(request).catch(() => ({ admin: null, response: null }));

    let query = supabase
      .from('product_reviews')
      .select('*, users (full_name)')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (!admin) {
      query = query.eq('is_visible', true);
    }

    const { data: reviews, error } = await query;
    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
    return NextResponse.json({ reviews: reviews || [] }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient();
  try {
    // 1. Authenticate from session (never trust client user id)
    const routeClient = await createRouteClient();
    const {
      data: { user: authUser },
    } = await routeClient.auth.getUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getProfileByAuthId(authUser.id, supabase);
    if (!profile) return NextResponse.json({ error: 'Account profile not found' }, { status: 404 });

    const body = await request.json();
    const { product_id, rating, comment, order_id } = body;

    if (!product_id || typeof product_id !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing product_id' }, { status: 400 });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }
    if (comment !== undefined && typeof comment !== 'string') {
      return NextResponse.json({ error: 'Comment must be a string if provided' }, { status: 400 });
    }

    // 2. Purchase-validated submission via the review service
    const result = await submitReview({
      profileId: profile.id,
      productId: product_id,
      rating,
      comment,
      orderId: order_id ?? undefined,
    });

    await logAudit(
      {
        actorUserId: profile.id,
        actorRole: profile.role ?? 'customer',
        action: result.updated ? 'review.updated' : 'review.created',
        entityType: 'product_review',
        entityId: result.id,
        after: { product_id, rating },
      },
      supabase
    );

    return NextResponse.json({ review: { id: result.id }, status: 201 }, { status: 201 });
  } catch (error) {
    if (error instanceof ReviewValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Server error creating review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}