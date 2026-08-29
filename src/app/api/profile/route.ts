import { NextResponse } from 'next/server';
import { createRouteClient, createServerClient } from '@/lib/supabase/server';
import { getProfileByAuthId } from '@/lib/services/users';

export async function GET() {
  const routeClient = await createRouteClient();
  const {
    data: { user },
  } = await routeClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ profile: null }, { status: 200 });
  }

  const supabase = createServerClient();
  const profile = await getProfileByAuthId(user.id, supabase);

  return NextResponse.json({ profile }, { status: 200 });
}
