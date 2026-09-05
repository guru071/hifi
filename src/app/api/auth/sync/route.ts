import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase/admin';
import { sendWelcomeMessage } from '@/lib/services/whatsapp-notifications';

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
    const requestedName = typeof body.full_name === 'string' ? body.full_name.trim().slice(0, 120) : null;
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 32) : null;
    if (phone && !/^[+\d][\d\s()-]{6,19}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Identity and account linking must come from the verified Firebase token.
    const email = decoded.email?.trim().toLowerCase() ?? null;
    const fallbackName = email?.split('@')[0] ?? null;
    const supabase = createServerClient();

    // Check if profile already exists for this Firebase UID
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id, full_name, phone')
      .eq('auth_id', decoded.uid)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      // Returning user — send welcome back if they have a phone
      if (phone || decoded.phoneNumber) {
        const userPhone = phone || decoded.phoneNumber;
        sendWelcomeMessage(userPhone, requestedName || decoded.name || 'there', false).catch(() => {});
      }
      if (requestedName || phone) {
        const { error: updateError } = await supabase.from('users').update({
          ...(requestedName && (!existing.full_name || existing.full_name === fallbackName) ? { full_name: requestedName } : {}),
          ...(phone && !existing.phone ? { phone } : {}),
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
        if (updateError) throw updateError;
      }
      return NextResponse.json({ synced: false, message: 'Profile already exists' }, { status: 200 });
    }

    // Also check by email (in case they had a Supabase account before)
    if (email) {
      const { data: byEmail, error: byEmailError } = await supabase
        .from('users')
        .select('id')
        .ilike('email', email)
        .maybeSingle();
      if (byEmailError) throw byEmailError;

      if (byEmail) {
        // Update existing profile with the Firebase UID
        const { error: linkError } = await supabase
          .from('users')
          .update({
            auth_id: decoded.uid,
            ...(requestedName ? { full_name: requestedName } : {}),
            ...(phone ? { phone } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', byEmail.id);
        if (linkError) throw linkError;
        // Returning user welcome
        if (phone || decoded.phoneNumber) {
          sendWelcomeMessage(phone || decoded.phoneNumber, requestedName || decoded.name || 'there', false).catch(() => {});
        }
        return NextResponse.json({ synced: true, message: 'Profile linked to Firebase UID' }, { status: 200 });
      }
    }

    const finalEmail = email ?? `${decoded.uid}@hificustom.local`;
    // Create new profile
    const { error } = await supabase.from('users').insert({
      auth_id: decoded.uid,
      email: finalEmail,
      full_name: requestedName || decoded.name || 'User',
      phone: phone ?? null,
      role: 'customer',
    });

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation (race condition)
        return NextResponse.json({ synced: true, message: 'Profile created concurrently' }, { status: 200 });
      }
      console.error('Error creating user profile:', error);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Send welcome message to new user
    if (phone) {
      sendWelcomeMessage(phone, requestedName || decoded.name || 'there', true).catch(() => {});
    }

    return NextResponse.json({ synced: true, message: 'Profile created' }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
