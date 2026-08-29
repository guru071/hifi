import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAdminRequest } from '@/lib/guards';

export async function GET(request: Request) {
  const supabase = createServerClient();
  try {
    const { response } = await requireAdminRequest(request);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const action = searchParams.get('action');
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500);

    let query = supabase
      .from('audit_logs')
      .select('*, users (full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityType) query = query.eq('entity_type', entityType);
    if (entityId) query = query.eq('entity_id', entityId);
    if (action) query = query.eq('action', action);

    const { data: auditLogs, error } = await query;
    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    return NextResponse.json({ auditLogs: auditLogs || [] }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}