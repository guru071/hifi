import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createOrder, OrderCreationError } from '@/lib/services/orders';
import { checkAdminAuth } from '@/lib/admin';
import { verifyFirebaseToken } from '@/lib/firebase/admin';
import { getProfileByAuthId } from '@/lib/services/users';

async function getUserRoleFromRequest(request: Request): Promise<'admin' | 'customer' | null> {
  if (await checkAdminAuth()) return 'admin';
  const decoded = await verifyFirebaseToken(request);
  if (!decoded) return null;
  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', decoded.uid)
    .maybeSingle();
  return (profile?.role as 'admin' | 'customer') ?? 'customer';
}

async function ensureOrderProfileId(request: Request) {
  const supabase = createServerClient();
  const decoded = await verifyFirebaseToken(request);
  if (!decoded) return null;

  const profile = await getProfileByAuthId(decoded.uid, supabase);
  if (profile?.id) return profile.id;

  if (decoded.email) {
    const { data: byEmail, error: byEmailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', decoded.email)
      .maybeSingle();

    if (byEmailError) {
      console.error('Error resolving profile by email:', byEmailError);
      return null;
    }

    if (byEmail?.id) {
      const { error: linkError } = await supabase
        .from('users')
        .update({ auth_id: decoded.uid, updated_at: new Date().toISOString() })
        .eq('id', byEmail.id);

      if (linkError) {
        console.error('Error linking Firebase UID to profile:', linkError);
        return null;
      }

      return byEmail.id;
    }
  }

  const fullName = decoded.name || decoded.email?.split('@')[0] || 'User';
  const { data: created, error: createError } = await supabase
    .from('users')
    .insert({
      auth_id: decoded.uid,
      email: decoded.email ?? '',
      full_name: fullName,
      role: 'customer',
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Error creating profile for order:', createError);
    return null;
  }

  return created.id;
}

export async function GET(request: Request) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const role = await getUserRoleFromRequest(request);
  const profileId = role !== 'admin' ? await ensureOrderProfileId(request) : null;

  try {
    let query = supabase
      .from('orders')
      .select('*, order_items (*), users (id, full_name, email, role)')
      .order('created_at', { ascending: false });

    if (userId) {
      if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      query = query.eq('user_id', userId);
    } else {
      if (role !== 'admin') {
        if (!profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        query = query.eq('user_id', profileId);
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
    const profileId = await ensureOrderProfileId(request);

    if (!profileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, full_name, email, phone')
      .eq('id', profileId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'Account profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const items = body.items;
    let shippingAddress = body.shippingAddress;

    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return NextResponse.json({ error: 'Invalid payload: missing shipping address' }, { status: 400 });
    }

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

    const result = await createOrder({ profileId: profile.id, items, address: shippingAddress });

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
