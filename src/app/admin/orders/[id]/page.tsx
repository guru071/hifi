import { createServerClient } from '@/lib/supabase/server';
import styles from '../../page.module.css';
import { notFound } from 'next/navigation';

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single();
    
  if (!order) return notFound();

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Order #{order.id.slice(0, 8)}</h1>
          <p className={styles.subtitle}>{new Date(order.created_at || '').toLocaleDateString()}</p>
        </div>
      </div>
      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        <h2 className={styles.cardTitle}>Customer ID: {order.user_id}</h2>
        <div style={{ marginTop: '2rem' }}>
          <h3>Items ({order.order_items?.length || 0})</h3>
          <p>Status: {order.status}</p>
          <p>Total: ₹{order.total_amount}</p>
        </div>
      </div>
    </div>
  );
}
