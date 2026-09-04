import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';
import { notFound } from 'next/navigation';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createServerClient();

  // 1. Fetch category
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!category) {
    notFound();
  }

  // 2. Fetch products in this category
  const { data } = await supabase
    .from('products')
    .select('*, product_variants(price_adjustment)')
    .eq('category_id', category.id)
    .eq('is_active', true);
    
  type ProductData = {
    id: string;
    title: string;
    base_price: number;
    image_url: string | null;
    [key: string]: unknown;
  };
  const products = (data as ProductData[]) || [];

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>{category.name}</h1>
          {category.description && (
            <p className={styles.description}>{category.description}</p>
          )}
        </div>

        <div className={styles.results}>
          <h2 className={styles.resultsTitle}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </h2>
          
          {products.length > 0 ? (
            <div className={styles.grid}>
              {products.map(product => (
                <Link href={`/product/${product.id}`} key={product.id} className={styles.card}>
                  <div className={styles.imageWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image_url || '/placeholder.png'} alt={product.title} className={styles.image} />
                  </div>
                  <div className={styles.info}>
                    <h3 className={styles.productTitle}>{product.title}</h3>
                    <p className={styles.price}>
                      ₹{Number(product.base_price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline)' }}>inventory_2</span>
              <p>No products available in this category yet.</p>
              <p style={{ color: 'var(--color-secondary)' }}>Check back later for new arrivals.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
