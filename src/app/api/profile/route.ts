import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  const decoded = await verifyFirebaseToken(request);
  if (!decoded) {
    return NextResponse.json({ profile: null }, { status: 200 });
  }

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', decoded.uid)
    .maybeSingle();

  return NextResponse.json({ profile }, { status: 200 });
}
