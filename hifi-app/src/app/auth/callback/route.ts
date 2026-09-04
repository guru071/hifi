import { NextResponse } from 'next/server';
import { createRouteClient, createServerClient } from '@/lib/supabase/server';
import { getProfileByAuthId } from '@/lib/services/users';
import { validateEmail } from '@/lib/email-validation';

/**
 * OAuth callback for Google / Apple. Exchanges the authorization code for a
 * session, then enforces the post-login checks:
 *  1. The provider email must not be a disposable address.
 *  2. The profile must have a phone number (required on all signups) — if
 *     missing, redirect to /complete-signup to collect it.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/profile';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const routeClient = await createRouteClient();
  const { error } = await routeClient.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const {
    data: { user },
  } = await routeClient.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // 1. Block disposable/fake provider emails.
  const emailError = validateEmail(user.email);
  if (emailError) {
    await routeClient.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(emailError)}`
    );
  }

  // 2. Ensure the profile has a phone number (required on all signups).
  const supabase = createServerClient();
  const profile = await getProfileByAuthId(user.id, supabase);
  if (profile && !profile.phone) {
    const redirectUrl = new URL('/complete-signup', origin);
    redirectUrl.searchParams.set('next', next);
    return NextResponse.redirect(redirectUrl);
  }

  const target = encodeURIComponent(next);
  return NextResponse.redirect(`${origin}/profile?welcome=1&next=${target}`);
}
