import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/guards';
import { logAudit } from '@/lib/services/audit';

interface GlobalDeliveryValue {
  type?: string;
  fee?: number;
  free_shipping_threshold?: number;
}

export async function GET() {
  const supabase = createServerClient();

  try {
    const { data: settings, error } = await supabase
      .from('delivery_settings')
      .select('*');

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings', details: error }, { status: 500 });
    }

    return NextResponse.json({ settings: settings || [] }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient();

  try {
    const { admin, response } = await requireAdminRequest(request);
    if (response) return response;

    const body = await request.json();

    if (!body.key || typeof body.key !== 'string') {
      return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 });
    }

    // Normalize delivery settings into the canonical global_delivery object
    let value = body.value;
    if (body.key === 'delivery_type' || body.key === 'global_delivery') {
      const current = await supabase.from('delivery_settings').select('*');
      const existing = current.data?.find((s) => s.setting_key === 'global_delivery')?.setting_value as unknown as GlobalDeliveryValue | undefined;

      if (body.key === 'delivery_type') {
        value = {
          type: body.value,
          fee: Number(existing?.fee) || 15,
          free_shipping_threshold: Number(existing?.free_shipping_threshold) || 150,
        };
      } else if (body.value?.type) {
        value = body.value;
      } else if (body.value?.fee !== undefined) {
        value = {
          type: existing?.type || 'global',
          fee: Number(body.value.fee),
          free_shipping_threshold: body.value.free_shipping_threshold !== undefined ? Number(body.value.free_shipping_threshold) : 150,
        };
      }
      body.key = 'global_delivery';
    }

    const { error } = await supabase
      .from('delivery_settings')
      .upsert(
        { setting_key: body.key, setting_value: value, updated_at: new Date().toISOString() },
        { onConflict: 'setting_key' }
      );

    if (error) throw error;

    await logAudit(
      {
        actorUserId: admin.user.id,
        actorRole: 'admin',
        action: 'settings.updated',
        entityType: 'delivery_settings',
        entityId: body.key,
        after: value,
      },
      supabase
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Server error updating setting:', error);
    return NextResponse.json({ error: 'Invalid request or server error' }, { status: 400 });
  }
}
