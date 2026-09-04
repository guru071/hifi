import { createServerClient } from '@/lib/supabase/server';
import styles from '../page.module.css';

export default async function AdminCustomDesigns() {
  const supabase = createServerClient();
  const { data: designs } = await supabase
    .from('custom_designs')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Custom Designs</h1>
          <p className={styles.subtitle}>Review and manage customer artwork submissions.</p>
        </div>
      </div>
      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {designs?.map((design) => (
                <tr key={design.id} className={styles.tr}>
                  <td className={styles.td}><span className={styles.orderId}>{design.id.slice(0,8)}</span></td>
                  <td className={styles.td}>{design.user_id?.slice(0,8) || 'Unknown'}</td>
                  <td className={styles.td}>{design.status}</td>
                  <td className={styles.td}>{new Date(design.created_at || '').toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
