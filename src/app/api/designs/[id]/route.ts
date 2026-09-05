import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/guards';
import { getProfileByAuthId } from '@/lib/services/users';
import { logAudit } from '@/lib/services/audit';
import { verifyFirebaseToken } from '@/lib/firebase/admin';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const params = await context.params;

  // Admin may view any design; a customer may view only their own.
  const { response: adminResponse } = await requireAdminRequest(request);
  if (!adminResponse) {
    // Admin access granted
  } else {
    const user = await verifyFirebaseToken(request);
    if (!user) {
      return adminResponse;
    }
    const profile = await getProfileByAuthId(user.uid, supabase);
    if (!profile) {
      return NextResponse.json({ error: 'Account profile not found' }, { status: 404 });
    }
    const { data: design, error } = await supabase
      .from('custom_designs')
      .select('id, reference_code, status, user_id, created_at')
      .eq('id', params.id)
      .eq('user_id', profile.id)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 });
    }
    if (!design) return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    return NextResponse.json({ design }, { status: 200 });
  }

  try {
    const { data: design, error } = await supabase
      .from('custom_designs')
      .select('*, users (full_name, email, phone)')
      .eq('id', params.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching design:', error);
      return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 });
    }
    if (!design) return NextResponse.json({ error: 'Design not found' }, { status: 404 });

    return NextResponse.json({ design }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching design:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const params = await context.params;

  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    const validStatus = ['pending', 'received', 'in_review', 'approved', 'rejected'];
    const fields = ['status', 'notes', 'design_name'];

    for (const key of fields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (updates.status && !validStatus.includes(updates.status as string)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const { data: before } = await supabase.from('custom_designs').select('*').eq('id', params.id).maybeSingle();
    if (!before) return NextResponse.json({ error: 'Design not found' }, { status: 404 });

    const { data: design, error } = await supabase
      .from('custom_designs')
      .update(updates as never)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating design:', error);
      return NextResponse.json({ error: 'Failed to update design' }, { status: 500 });
    }

    if (body.status) {
      await logAudit(
        {
          actorUserId: admin.user.id,
          actorRole: 'admin',
          action: `design.${body.status}`,
          entityType: 'custom_design',
          entityId: params.id,
          before,
          after: design,
        },
        supabase
      );
    }

    return NextResponse.json({ design }, { status: 200 });
  } catch (error) {
    console.error('Server error updating design:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
