import { createServerClient, createRouteClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const routeClient = await createRouteClient();
  const { error } = await routeClient.auth.signOut();

  if (error) {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await routeClient.auth.getUser();
    if (user) await supabase.auth.admin.signOut(user.id);
  }

  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL!));
}