import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductRow, ProductImageRow, CategoryRow } from '@/lib/supabase/rows';

type ProductVariantPick = {
  id: string;
  color: string;
  size: string;
  sku: string;
  inventory_count: number | null;
  price_adjustment: number | null;
};

export type ProductWithDetails = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  base_price: number;
  image_url: string | null;
  category: string | null;
  category_id: string | null;
  is_active: boolean | null;
  delivery_fee: number | null;
  created_at: string | null;
  updated_at: string | null;
  product_variants: ProductVariantPick[];
  product_images?: { url: string; alt: string | null; is_hero: boolean | null }[];
  images?: { url: string; alt: string | null; is_hero: boolean | null }[];
  category_name?: string | null;
};

type ProductQueryRow = ProductRow & {
  product_variants?: ProductVariantPick[] | null;
  product_images?: (ProductImageRow & { sort_order?: number | null })[] | null;
  categories?: Pick<CategoryRow, 'id' | 'name' | 'slug'> | null;
};

/**
 * Fetch all active products with variants, hero image, and category.
 */
export async function listActiveProducts(supabase?: SupabaseClient): Promise<ProductWithDetails[]> {
  const client = supabase ?? createServerClient();

  const { data: products, error } = await client
    .from('products')
    .select(`
      *,
      product_variants (*),
      product_images (*),
      categories (id, name, slug)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch products: ${error.message}`);

  return (products ?? []).map((p) => normalizeProduct(p as unknown as ProductQueryRow));
}

/**
 * Fetch ALL products (including inactive) — for admin catalog management.
 */
export async function listAdminProducts(supabase?: SupabaseClient): Promise<ProductWithDetails[]> {
  const client = supabase ?? createServerClient();

  const { data: products, error } = await client
    .from('products')
    .select(`
      *,
      product_variants (*),
      product_images (*),
      categories (id, name, slug)
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch products: ${error.message}`);

  return (products ?? []).map((p) => normalizeProduct(p as unknown as ProductQueryRow));
}

/**
 * Fetch a single active product by id/slug, including stock-aware variants.
 */
export async function getProductById(id: string, supabase?: SupabaseClient) {
  const client = supabase ?? createServerClient();
  const { data, error } = await client
    .from('products')
    .select(`
      *,
      product_variants (*),
      product_images (*),
      categories (id, name, slug)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch product: ${error.message}`);
  return data ? normalizeProduct(data as unknown as ProductQueryRow) : null;
}

function normalizeProduct(p: ProductQueryRow): ProductWithDetails {
  const images: { url: string; alt: string | null; is_hero: boolean | null }[] = (p.product_images ?? [])
    .filter((i) => i.url)
    .sort((a, b) => {
      if (a.is_hero && !b.is_hero) return -1;
      if (!a.is_hero && b.is_hero) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .map((i) => ({ url: i.url, alt: i.alt, is_hero: i.is_hero }));

  if (images.length === 0 && p.image_url) {
    images.push({ url: p.image_url, alt: p.title, is_hero: true });
  }

  const hero = images.find((i) => i.is_hero) || images[0];

  return {
    ...p,
    product_variants: p.product_variants ?? [],
    product_images: images,
    images,
    image_url: hero?.url ?? p.image_url,
    category_name: p.categories?.name ?? p.category,
  };
}
