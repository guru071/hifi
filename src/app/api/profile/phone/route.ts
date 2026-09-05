import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase/admin';
import { setUserPhone } from '@/lib/services/users';

async function savePhone(request: Request) {
  const decoded = await verifyFirebaseToken(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!phone) {
    return NextResponse.json({ error: 'A phone number is required' }, { status: 400 });
  }
  if (!/^[+\d][\d\s()-]{6,19}$/.test(phone)) {
    return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', decoded.uid)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    await setUserPhone(profile.id, phone, supabase);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = savePhone;
export const PUT = savePhone;
