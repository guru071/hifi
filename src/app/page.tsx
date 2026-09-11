/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import styles from "./page.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";
import { listActiveProducts } from "@/lib/services/catalog";
import { createServerClient } from "@/lib/supabase/server";

type FeaturedProduct = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  imageUrl: string;
  imageAlt: string;
  soldOut: boolean;
  inr: boolean;
};

export const revalidate = 0;

export default async function Home({ searchParams }: { searchParams?: { category?: string } }) {
  const selectedCategory = searchParams?.category;
  const supabase = createServerClient();
  
  const [productsRes, catRes, bannerRes] = await Promise.all([
    listActiveProducts(),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('delivery_settings').select('setting_value').eq('setting_key', 'home_banners').maybeSingle()
  ]);

  const activeProducts = productsRes;
  const categories = catRes.data || [];
  const banners = (bannerRes.data?.setting_value as { id: string; image_url: string; link_url: string }[]) || [];

  
  let filteredProducts = activeProducts;
  if (selectedCategory) {
    filteredProducts = activeProducts.filter(p => p.category_name === selectedCategory || p.category === selectedCategory);
  } else {
    // default show 6 products if no category is selected
    filteredProducts = activeProducts.slice(0, 6);
  }

  const products: FeaturedProduct[] = filteredProducts.map(p => ({
    id: p.id,
    title: p.title,
    subtitle: (p.subtitle || p.category_name || p.category || "T-Shirt") as string,
    price: Number(p.base_price),
    imageUrl: p.image_url as string,
    imageAlt: p.title,
    soldOut: !(p.product_variants || []).some((v) => Number(v.inventory_count) > 0),
    inr: true,
  }));

  return (
    <main className={styles.main}>
      <Navbar />

      {/* Promotional Banners Carousel */}
      {banners.length > 0 && (
        <section className={styles.bannerSection}>
          <div className={styles.bannerScroller}>
            {banners.map((b) => (
              <Link href={b.link_url || '#'} key={b.id} className={styles.bannerCard}>
                <img src={b.image_url} data-eslint-disable="true" alt="Offer Poster" className={styles.bannerImage} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories Bar (Flipkart Style) */}
      <section className={styles.categoryBar}>
        {categories.map((cat) => (
          <Link href={`/?category=${cat.name}#products`} scroll={true} key={cat.id} className={styles.categoryBubble}>
            <div className={styles.categoryImageWrap}>
              {cat.image_url ? (
                <img src={cat.image_url} data-eslint-disable="true" alt={cat.name} className={styles.categoryImage} />
              ) : (
                <span className="material-symbols-outlined" style={{ color: 'var(--color-outline)' }}>category</span>
              )}
            </div>
            <span className={styles.categoryName}>{cat.name}</span>
          </Link>
        ))}
      </section>

      {/* Immersive Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroImageContainer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero_tshirt.png"
            alt="Premium white T-shirt on model"
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroContent}>
          <div className={`${styles.heroPanel} glass-panel`}>
            <h1 className={styles.heroTitle}>THE PERFECT CANVAS.</h1>
            <p className={styles.heroSubtitle}>
              Premium quality meets your original expression. Hand-customized in our studio.
            </p>
            <Link href="#collection" className={styles.heroButton}>
              Explore the Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Collection Section */}
      <section id="collection" className={styles.collectionSection}>
        <div className={styles.collectionHeader}>
          <h2 className={styles.collectionTitle}>Core Essentials</h2>
          <Link href="/shop" className={styles.viewAllLink}>
            VIEW ALL
          </Link>
        </div>
        <div className={styles.productGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className={styles.processSection}>
        <div className={styles.processContainer}>
          <div className={styles.processHeader}>
            <h2 className={styles.processTitle}>The Process</h2>
            <p className={styles.processSubtitle}>
              Three simple steps to transform our premium blanks into your bespoke garment.
            </p>
          </div>
          <div className={styles.processGrid}>
            <div className={styles.connectingLine}></div>
            
            {/* Step 1 */}
            <div className={styles.processStep}>
              <div className={`${styles.processIconContainer} glass-panel`}>
                <span className={`material-symbols-outlined ${styles.processIcon}`}>apparel</span>
              </div>
              <h4 className={styles.processStepTitle}>1. Select Base</h4>
              <p className={styles.processStepDesc}>
                Choose from our meticulously crafted silhouettes and weights.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className={styles.processStep}>
              <div className={`${styles.processIconContainer} glass-panel`}>
                <span className={`material-symbols-outlined ${styles.processIcon}`}>draw</span>
              </div>
              <h4 className={styles.processStepTitle}>2. Send Design</h4>
              <p className={styles.processStepDesc}>
                Upload your artwork or work with our studio to refine your vision.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className={styles.processStep}>
              <div className={`${styles.processIconContainer} glass-panel`}>
                <span className={`material-symbols-outlined ${styles.processIcon}`}>local_shipping</span>
              </div>
              <h4 className={styles.processStepTitle}>3. Hand-Printed</h4>
              <p className={styles.processStepDesc}>
                Expertly applied in our studio and delivered with care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className={styles.brandSection}>
        <div className={styles.brandGrid}>
          <div className={styles.brandTextContent}>
            <h2 className={styles.brandTitle}>Crafted with Precision.</h2>
            <p className={styles.brandDescLarge}>
              At HIFI, we believe that true luxury lies in the details. Our manual customization process ensures that every piece is unique, reflecting the meticulous craftsmanship of our studio artisans.
            </p>
            <p className={styles.brandDescSmall}>
              We reject mass production in favor of a thoughtful, hands-on approach. From selecting the finest raw materials to the final press of the print, our process is designed to deliver garments that look exceptional and feel deeply personal.
            </p>
            <button className={styles.brandLink}>
              DISCOVER OUR STUDIO
            </button>
          </div>
          <div className={styles.brandImageContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/studio_craft.png"
              alt="Studio printing process"
              className={styles.brandImage}
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
