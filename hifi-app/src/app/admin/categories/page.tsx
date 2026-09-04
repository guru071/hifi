import { createServerClient } from '@/lib/supabase/server';
import styles from '../page.module.css';
import Link from 'next/link';

export default async function AdminCategories() {
  const supabase = createServerClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.subtitle}>Manage product collections and groupings.</p>
        </div>
        <Link href="/admin/categories/create" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-full)', textDecoration: 'none', fontWeight: 600 }}>
          Create Category
        </Link>
      </div>
      <div className={`glass-panel ${styles.recentOrdersCard}`}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Slug</th>
                <th className={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {categories?.map((cat) => (
                <tr key={cat.id} className={styles.tr}>
                  <td className={styles.td}>{cat.name}</td>
                  <td className={styles.td}>{cat.slug}</td>
                  <td className={styles.td}>{new Date(cat.created_at || '').toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
