import type { Metadata, ResolvingMetadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  try {
    const supabase = createServerClient();
    const { data: product } = await supabase
      .from('products')
      .select('title, description, image_url, base_price, product_images(url)')
      .eq('id', id)
      .maybeSingle();

    if (!product) {
      return { title: 'Product Not Found' };
    }

    const previousImages = (await parent).openGraph?.images || [];
    const productImages = product.product_images as any[] | undefined;
    const heroImage = product.image_url || productImages?.[0]?.url;

    return {
      title: product.title,
      description: product.description || `Buy ${product.title} at HIFI E-commerce.`,
      openGraph: {
        title: product.title,
        description: product.description || `Buy ${product.title} at HIFI E-commerce.`,
        images: heroImage ? [heroImage, ...previousImages] : previousImages,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.title,
        description: product.description || `Buy ${product.title} at HIFI E-commerce.`,
        images: heroImage ? [heroImage] : [],
      },
    };
  } catch (error) {
    console.error('Failed to generate product metadata:', error);
    return {
      title: 'Product',
    };
  }
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>;
}
