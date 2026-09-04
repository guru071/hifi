import { createServerClient } from '@/lib/supabase/server';
import styles from '../page.module.css';

export default async function AdminNotifications() {
  const supabase = createServerClient();

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, created_at, status, user_id, users(full_name)')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch recent whatsapp logs
  const { data: recentMessages } = await supabase
    .from('whatsapp_logs')
    .select('id, created_at, body, from_number')
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(5);

  const notifications = [
    ...(recentOrders || []).map((o) => {
      const user = o.users as { full_name?: string } | null;
      return {
        id: o.id,
        type: 'Order',
        title: `New Order: ${user?.full_name || 'Customer'}`,
        description: `Status: ${o.status}`,
        date: o.created_at,
        icon: 'shopping_cart',
      };
    }),
    ...(recentMessages || []).map(m => ({
      id: m.id,
      type: 'Message',
      title: `WhatsApp from ${m.from_number}`,
      description: m.body,
      date: m.created_at,
      icon: 'chat'
    }))
  ].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>System alerts and broadcasts.</p>
        </div>
      </div>
      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        {notifications.length === 0 ? (
          <p>No new notifications.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map(n => (
              <div key={`${n.type}-${n.id}`} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--color-outline)' }}>
                <div style={{ backgroundColor: 'var(--color-surface-variant)', color: 'var(--color-on-surface-variant)', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined">{n.icon}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>{n.title}</span>
                  <span style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>{n.description}</span>
                  <span style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {new Date(n.date || '').toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
