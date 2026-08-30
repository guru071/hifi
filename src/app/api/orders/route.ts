import { NextResponse } from 'next/server';
import { createServerClient, createRouteClient } from '@/lib/supabase/server';
import { createOrder, OrderCreationError } from '@/lib/services/orders';
import { getProfileByAuthId } from '@/lib/services/users';
import { getUserRole } from '@/lib/admin';

export async function GET(request: Request) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const role = await getUserRoleFromRequest(request);

  const routeClient = await createRouteClient();
  const {
    data: { user: authUser },
  } = await routeClient.auth.getUser();

  // Customers may only ever fetch their own orders.
  const profile = authUser ? await getProfileByAuthId(authUser.id, supabase) : null;

  try {
    let query = supabase
      .from('orders')
      .select('*, order_items (*), users (id, full_name, email, role)')
      .order('created_at', { ascending: false });

    if (userId) {
      if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      query = query.eq('user_id', userId);
    } else {
      // If admin, they can fetch all orders without a profile
      if (role !== 'admin') {
        if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        query = query.eq('user_id', profile.id);
      }
    }

    const { data: orders, error } = await query;
    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
    return NextResponse.json({ orders: orders || [] }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();

    // 1. Resolve the authenticated user strictly from the session (never client-supplied userId)
    const routeClient = await createRouteClient();
    const {
      data: { user: authUser },
    } = await routeClient.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileByAuthId(authUser.id, supabase);
    if (!profile) {
      return NextResponse.json({ error: 'Account profile not found' }, { status: 404 });
    }

    // 2. Parse + shape payload
    const body = await request.json();
    const items = body.items;
    let shippingAddress = body.shippingAddress;

    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return NextResponse.json({ error: 'Invalid payload: missing shipping address' }, { status: 400 });
    }

    // Expand a legacy flat shipping object into a structured address
    if (!shippingAddress.line1) {
      shippingAddress = {
        full_name: shippingAddress.name ?? profile.full_name ?? '',
        phone: shippingAddress.phone ?? '',
        line1: shippingAddress.address ?? shippingAddress.line1 ?? '',
        city: shippingAddress.city ?? '',
        state: shippingAddress.state ?? '',
        postal_code: shippingAddress.postal_code ?? shippingAddress.zip ?? '',
        country: shippingAddress.country ?? 'India',
      };
    }

    // 3. Delegate to the order service (server-side pricing, delivery calc, snapshot, inventory, razorpay)
    const result = await createOrder({
      profileId: profile.id,
      items,
      address: shippingAddress,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: result.orderId,
        razorpayOrderId: result.razorpayOrderId,
        amount: result.amount,
        currency: result.currency,
        razorpayInitFailed: result.razorpayInitFailed,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Server error creating order:', error);
    return NextResponse.json({ error: 'Invalid request or server error' }, { status: 400 });
  }
}

import { checkAdminAuth } from '@/lib/admin';

async function getUserRoleFromRequest(request: Request) {
  if (await checkAdminAuth()) return 'admin';
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const supabase = createServerClient();
  const token = authHeader.slice(7);
  const { data } = await supabase.auth.getUser(token);
  if (!data.user) return null;
  return getUserRole(data.user.id);
}