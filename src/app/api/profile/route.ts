import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { verifyFirebaseToken } from '@/lib/firebase/admin';
import { sendWelcomeMessage } from '@/lib/services/whatsapp-notifications';

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

export async function POST(request: Request) {
  const decoded = await verifyFirebaseToken(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const body = await request.json().catch(() => ({}));
  
  const updates: { phone?: string } = {};
  if (body.phone !== undefined) {
    updates.phone = body.phone;
  }
  
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('auth_id', decoded.uid)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Trigger welcome message if phone was added/updated
  if (updates.phone) {
    sendWelcomeMessage(updates.phone, data.full_name || decoded.name || 'there', false).catch(err => {
      console.error("Failed to send welcome message after profile update:", err);
    });
  }

  return NextResponse.json({ profile: data }, { status: 200 });
}
