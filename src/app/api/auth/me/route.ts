import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/admin';

export async function GET() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const role = await getUserRole(user.id);

  return NextResponse.json({ user, role });
}
