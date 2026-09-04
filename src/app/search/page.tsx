import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';


export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q || '';
  const supabase = createServerClient();

  type ProductData = {
    id: string;
    title: string;
    base_price: number;
    image_url: string | null;
    [key: string]: unknown;
  };
  let products: ProductData[] = [];
  if (query) {
    const { data } = await supabase
      .from('products')
      .select('*, product_variants(price_adjustment)')
      .ilike('title', `%${query}%`)
      .eq('is_active', true);
      
    products = data || [];
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Search</h1>
          <form className={styles.searchForm} action="/search" method="GET">
            <input 
              type="text" 
              name="q" 
              defaultValue={query} 
              placeholder="Search for products..." 
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn}>
              <span className="material-symbols-outlined">search</span>
            </button>
          </form>
        </div>

        {query && (
          <div className={styles.results}>
            <h2 className={styles.resultsTitle}>
              {products.length} result{products.length !== 1 ? 's' : ''} for &quot;{query}&quot;
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
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline)' }}>search_off</span>
                <p>We couldn&apos;t find any matches for &quot;{query}&quot;.</p>
                <p style={{ color: 'var(--color-secondary)' }}>Try adjusting your search or browse our collections.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
