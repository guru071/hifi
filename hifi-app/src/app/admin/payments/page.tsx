import { createServerClient } from '@/lib/supabase/server';
import styles from '../page.module.css';

export default async function AdminPayments() {
  const supabase = createServerClient();
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Payments</h1>
          <p className={styles.subtitle}>Razorpay transactions ledger.</p>
        </div>
      </div>
      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Payment ID</th>
                <th className={styles.th}>Order ID</th>
                <th className={styles.th}>Amount</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((payment) => (
                <tr key={payment.id} className={styles.tr}>
                  <td className={styles.td}>{payment.razorpay_payment_id || 'N/A'}</td>
                  <td className={styles.td}>{payment.razorpay_order_id || 'N/A'}</td>
                  <td className={styles.td}>₹{payment.amount}</td>
                  <td className={styles.td}>{payment.status}</td>
                  <td className={styles.td}>{new Date(payment.created_at || '').toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
