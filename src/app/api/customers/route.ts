export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface CustomerOrder {
  id?: string;
  total_amount?: number;
  payment_status?: string | null;
  status?: string | null;
}

interface CustomerWithOrders {
  id: string;
  orders?: CustomerOrder[] | null;
  [key: string]: unknown;
}

interface CustomerAggregate extends CustomerWithOrders {
  total_orders: number;
  total_spent: number;
  paid_orders: number;
  pending_payments: number;
}

import { checkAdminAuth } from '@/lib/admin';

export async function GET() {
  const supabase = createServerClient();

  // Admin-only
  if (!(await checkAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*, orders (id, total_amount, payment_status, status)')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers', details: error }, { status: 500 });
    }

    const customers: CustomerAggregate[] = ((users ?? []) as unknown as CustomerWithOrders[]).map((user) => {
      const userOrders = user.orders ?? [];
      const paid = userOrders.filter((o) => o.payment_status === 'paid');
      const total_spent = paid.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const pending = userOrders.filter((o) => o.payment_status === 'pending').length;
      return { ...user, total_orders: userOrders.length, total_spent, paid_orders: paid.length, pending_payments: pending };
    });

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    console.error('Server error fetching customers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}