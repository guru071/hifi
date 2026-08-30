import { NextResponse } from 'next/server';
import { createServerClient, createRouteClient } from '@/lib/supabase/server';
import { getProfileByAuthId } from '@/lib/services/users';
import { getUserRole } from '@/lib/admin';
import { requireAdminRequest } from '@/lib/guards';
import { logAudit } from '@/lib/services/audit';
import { checkAdminAuth } from '@/lib/admin';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const params = await context.params;
  const authHeader = request.headers.get('Authorization');

  // Resolve caller from bearer token or session cookie; admins may fetch any order.
  let callerUser: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] | null = null;
  let isAdmin = await checkAdminAuth();
  
  if (!isAdmin) {
    if (authHeader?.startsWith('Bearer ')) {
      const { data } = await supabase.auth.getUser(authHeader.slice(7));
      callerUser = data.user;
      if (callerUser) isAdmin = (await getUserRole(callerUser.id)) === 'admin';
    } else {
      const routeClient = await createRouteClient();
      const { data } = await routeClient.auth.getUser();
      callerUser = data.user;
    }
  }

  if (!isAdmin && !callerUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items (*), invoices (*)')
      .eq('id', params.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching order:', error);
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Ownership check: customers see only their own orders
    if (!isAdmin) {
      const profile = await getProfileByAuthId(callerUser!.id, supabase);
      if (!profile || order.user_id !== profile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const ORDER_STATUSES = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();

  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const params = await context.params;
    const body = await request.json();
    const { status, payment_status } = body;

    if (status !== undefined && !ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of ${ORDER_STATUSES.join(', ')}` }, { status: 400 });
    }
    if (payment_status !== undefined && !PAYMENT_STATUSES.includes(payment_status)) {
      return NextResponse.json({ error: `payment_status must be one of ${PAYMENT_STATUSES.join(', ')}` }, { status: 400 });
    }
    if (status === undefined && payment_status === undefined) {
      return NextResponse.json({ error: 'Provide status or payment_status to update' }, { status: 400 });
    }

    const { data: current, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, payment_status')
      .eq('id', params.id)
      .maybeSingle();
    if (fetchError) {
      console.error('Error fetching order for update:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const { data: order, error } = await supabase
      .from('orders')
      .update({
        ...(status !== undefined && { status }),
        ...(payment_status !== undefined && { payment_status }),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'order.updated',
        entityType: 'order',
        entityId: order.id,
        before: current,
        after: { status: order.status, payment_status: order.payment_status },
      },
      supabase
    );

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Server error updating order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}