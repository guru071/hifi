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

    const patch: Record<string, unknown> = {};
    const allowed = ['name', 'slug', 'description', 'image_url', 'sort_order', 'is_active'];
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const { data: before } = await supabase.from('categories').select('*').eq('id', params.id).maybeSingle();
    if (!before) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const { data: category, error } = await supabase
      .from('categories')
      .update(patch as never)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'category.updated',
        entityType: 'category',
        entityId: params.id,
        before,
        after: category,
      },
      supabase
    );

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    console.error('Server error updating category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const params = await context.params;
    const { error } = await supabase.from('categories').delete().eq('id', params.id);
    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'category.deleted',
        entityType: 'category',
        entityId: params.id,
      },
      supabase
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error deleting category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}