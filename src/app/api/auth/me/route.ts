import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  const decoded = await verifyFirebaseToken(request);
  if (!decoded) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, role, phone')
    .eq('auth_id', decoded.uid)
    .maybeSingle();

  return NextResponse.json({ user: decoded, profile, role: profile?.role ?? 'customer' });
}
