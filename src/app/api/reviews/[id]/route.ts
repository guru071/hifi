import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/guards';
import { logAudit } from '@/lib/services/audit';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const params = await context.params;
    const body = await request.json();

    if (body.is_visible === undefined && body.comment === undefined && body.rating === undefined) {
      return NextResponse.json({ error: 'Provide is_visible, comment, or rating to update' }, { status: 400 });
    }

    const { data: before } = await supabase.from('product_reviews').select('*').eq('id', params.id).maybeSingle();
    if (!before) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const patch: Record<string, unknown> = {};
    if (body.is_visible !== undefined) patch.is_visible = !!body.is_visible;
    if (body.comment !== undefined) patch.comment = typeof body.comment === 'string' ? body.comment : null;
    if (body.rating !== undefined) {
      if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
        return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
      }
      patch.rating = body.rating;
    }

    const { data: review, error } = await supabase
      .from('product_reviews')
      .update(patch as never)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating review:', error);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: body.is_visible === true ? 'review.approved' : body.is_visible === false ? 'review.hidden' : 'review.updated',
        entityType: 'product_review',
        entityId: params.id,
        before,
        after: review,
      },
      supabase
    );

    return NextResponse.json({ review }, { status: 200 });
  } catch (error) {
    console.error('Server error updating review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const params = await context.params;
    const { error } = await supabase.from('product_reviews').delete().eq('id', params.id);
    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'review.deleted',
        entityType: 'product_review',
        entityId: params.id,
      },
      supabase
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error deleting review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}