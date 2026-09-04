import styles from '../page.module.css';
import { createServerClient } from '@/lib/supabase/server';

export default async function AdminRoles() {
  const supabase = createServerClient();
  const { data: users } = await supabase.from('users').select('*').in('role', ['admin']);
  
  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Roles & Permissions</h1>
          <p className={styles.subtitle}>Manage team access levels.</p>
        </div>
      </div>
      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className={styles.tr}>
                  <td className={styles.td}>{user.full_name}</td>
                  <td className={styles.td}>{user.email}</td>
                  <td className={styles.td}>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
