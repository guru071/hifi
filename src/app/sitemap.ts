import type { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hificustoms.com';
  
  // Static routes
  const routes = [
    '',
    '/products',
    '/contact',
    '/privacy',
    '/terms',
    '/shipping',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    const supabase = createServerClient();
    
    // Fetch all active products
    const { data: products } = await supabase
      .from('products')
      .select('id, updated_at')
      .eq('is_active', true);

    if (products) {
      const productRoutes = products.map((product) => ({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: product.updated_at || new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));
      
      return [...routes, ...productRoutes];
    }
  } catch (error) {
    console.error('Failed to generate dynamic sitemap routes:', error);
  }

  return routes;
}
