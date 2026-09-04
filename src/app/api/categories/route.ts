import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/guards';
import { logAudit } from '@/lib/services/audit';

export async function GET() {
  const supabase = createServerClient();
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(50);
    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
    return NextResponse.json({ categories: categories || [] }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient();
  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const body = await request.json();
    const { name, slug, description, image_url, sort_order, is_active } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const slugValue = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    if (!slugValue) return NextResponse.json({ error: 'slug is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        slug: slugValue,
        description: description ?? null,
        image_url: image_url ?? null,
        sort_order: (typeof sort_order === 'number' ? sort_order : 0),
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json({ error: error.code === '23505' ? 'A category with that name/slug already exists' : 'Failed to create category' }, { status: 500 });
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'category.created',
        entityType: 'category',
        entityId: data.id,
        after: { name: data.name, slug: data.slug },
      },
      supabase
    );

    return NextResponse.json({ category: data }, { status: 201 });
  } catch (error) {
    console.error('Server error creating category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}