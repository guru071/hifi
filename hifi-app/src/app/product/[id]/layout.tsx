import type { Metadata, ResolvingMetadata } from 'next';
import { getProductById } from '@/lib/services/catalog';

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
    const product = await getProductById(id);

    if (!product) {
      return { title: 'Product Not Found' };
    }

    const previousImages = (await parent).openGraph?.images || [];
    const heroImage = product.image_url || product.product_images?.[0]?.url;

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
