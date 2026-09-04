import { NextResponse } from 'next/server';
import { createServerClient, createRouteClient } from '@/lib/supabase/server';
import { createDesignSubmission, resolveDesignImageUrl } from '@/lib/services/designs';
import { getProfileByAuthId } from '@/lib/services/users';
import { logAudit } from '@/lib/services/audit';

import { checkAdminAuth } from '@/lib/admin';

export async function GET() {
  const supabase = createServerClient();
  // Admin-only: design queue is backend-facing
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: designs, error } = await supabase
      .from('custom_designs')
      .select('*, users (full_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching designs:', error);
      return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
    }

    // Resolve private storage paths into short-lived signed URLs for admin viewing.
    const signed = await Promise.all(
      (designs || []).map(async (design) => {
        const signedUrl = await resolveDesignImageUrl(
          design.design_image_url ?? design.media_url ?? null,
          supabase
        );
        return { ...design, design_image_url: signedUrl ?? design.design_image_url };
      })
    );

    return NextResponse.json({ designs: signed }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching designs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient();

  try {
    const body = await request.json();

    // Resolve the authenticated submitter (optional; webhook submissions are anonymous)
    const routeClient = await createRouteClient();
    const {
      data: { user: authUser },
    } = await routeClient.auth.getUser();
    const profile = authUser ? await getProfileByAuthId(authUser.id, supabase) : null;

    const newDesign = await createDesignSubmission({
      profileId: profile?.id ?? body.userId ?? null,
      senderPhone: body.senderPhone ?? null,
      designName: body.designName ?? null,
      mediaUrl: body.mediaUrl ?? null,
      notes: body.notes ?? null,
      supabase,
    });

    await logAudit(
      {
        actorUserId: profile?.id ?? null,
        actorRole: profile?.role ?? 'customer',
        action: 'design.created',
        entityType: 'custom_design',
        entityId: newDesign.id,
        after: { reference_code: newDesign.reference_code },
      },
      supabase
    );

    return NextResponse.json({ success: true, design: newDesign }, { status: 201 });
  } catch (error) {
    console.error('Server error initializing custom design:', error);
    return NextResponse.json({ error: 'Invalid request or server error' }, { status: 400 });
  }
}
