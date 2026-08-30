import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase/admin';

/**
 * POST /api/auth/sync
 * Called after Firebase login to ensure a profile row exists in Supabase users table.
 * Creates the profile if it doesn't exist yet (first login).
 */
export async function POST(request: Request) {
  const decoded = await verifyFirebaseToken(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, full_name, phone } = body;
    const supabase = createServerClient();

    // Check if profile already exists for this Firebase UID
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', decoded.uid)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ synced: false, message: 'Profile already exists' }, { status: 200 });
    }

    // Also check by email (in case they had a Supabase account before)
    if (email) {
      const { data: byEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (byEmail) {
        // Update existing profile with the Firebase UID
        await supabase
          .from('users')
          .update({ auth_id: decoded.uid, updated_at: new Date().toISOString() })
          .eq('id', byEmail.id);
        return NextResponse.json({ synced: true, message: 'Profile linked to Firebase UID' }, { status: 200 });
      }
    }

    // Create new profile
    const { error } = await supabase.from('users').insert({
      auth_id: decoded.uid,
      email: email ?? decoded.email ?? null,
      full_name: full_name ?? decoded.name ?? 'User',
      phone: phone ?? null,
      role: 'customer',
    });

    if (error) {
      console.error('Error creating user profile:', error);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({ synced: true, message: 'Profile created' }, { status: 201 });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
