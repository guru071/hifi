import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { Json } from '@/types/supabase';

interface AnalyticsEventBody {
  event_type?: unknown;
  page_url?: unknown;
  session_id?: unknown;
  user_id?: unknown;
  product_id?: unknown;
  metadata?: Json | null;
}

import { checkAdminAuth } from '@/lib/admin';

export async function GET(request: Request) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get('eventType');
  const from = searchParams.get('from');

  // Admin-only analytics read
  if (!(await checkAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let query = supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(1000);
    if (eventType) query = query.eq('event_type', eventType);
    if (from) query = query.gte('created_at', from);

    const { data: events, error } = await query;
    if (error) {
      console.error('Error fetching analytics:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Lightweight client-side aggregation
    const totals: Record<string, number> = {};
    (events ?? []).forEach((e) => {
      totals[e.event_type] = (totals[e.event_type] || 0) + 1;
    });

    return NextResponse.json({ events: events || [], totals }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient();
  try {
    const body = (await request.json()) as AnalyticsEventBody;
    const { event_type, page_url, session_id, user_id, product_id, metadata } = body;

    // Validate allowed event types to avoid junk rows
    const allowed = ['page_view', 'product_view', 'add_to_cart', 'checkout_started', 'purchase', 'search'];
    const event = String(event_type || '');
    if (!allowed.includes(event)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: event,
        page_url: page_url ? String(page_url) : null,
        session_id: session_id ? String(session_id) : null,
        user_id: user_id ? String(user_id) : null,
        product_id: product_id ? String(product_id) : null,
        metadata: (metadata as Json) || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording analytics:', error);
      return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
    }
    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    console.error('Server error recording analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}