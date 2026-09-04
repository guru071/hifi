import { createServerClient } from '@/lib/supabase/server';
import styles from '../page.module.css';

export default async function AdminInvoices() {
  const supabase = createServerClient();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>Generated tax invoices for all orders.</p>
        </div>
      </div>
      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Invoice #</th>
                <th className={styles.th}>Order ID</th>
                <th className={styles.th}>Total</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices?.map((invoice) => (
                <tr key={invoice.id} className={styles.tr}>
                  <td className={styles.td}>{invoice.invoice_number}</td>
                  <td className={styles.td}><span className={styles.orderId}>{invoice.order_id?.slice(0, 8)}</span></td>
                  <td className={styles.td}>₹{invoice.total}</td>
                  <td className={styles.td}>{invoice.status}</td>
                  <td className={styles.td}>{new Date(invoice.issued_at || '').toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
