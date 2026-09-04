import { createServerClient } from '@/lib/supabase/server';
import styles from '../page.module.css';

export default async function AdminAnalytics() {
  const supabase = createServerClient();
  const { data: orders } = await supabase.from('orders').select('id, total_amount, status');
  const { data: users } = await supabase.from('users').select('id');

  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;
  const totalUsers = users?.length || 0;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Sales, traffic, and conversion metrics.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        <div className={`glass-panel ${styles.recentOrdersCard}`}>
          <h3 style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Total Revenue</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className={`glass-panel ${styles.recentOrdersCard}`}>
          <h3 style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Total Orders</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{totalOrders}</p>
        </div>
        <div className={`glass-panel ${styles.recentOrdersCard}`}>
          <h3 style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Avg Order Value</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>₹{averageOrderValue}</p>
        </div>
        <div className={`glass-panel ${styles.recentOrdersCard}`}>
          <h3 style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>Total Customers</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{totalUsers}</p>
        </div>
      </div>
    </div>
  );
}
