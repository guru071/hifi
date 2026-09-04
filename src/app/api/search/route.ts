import { NextResponse } from 'next/server';
import { listActiveProducts } from '@/lib/services/catalog';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    let products = await listActiveProducts();
    
    if (q) {
      const qLower = q.toLowerCase();
      products = products.filter(p => 
        p.title.toLowerCase().includes(qLower) || 
        (p.description && p.description.toLowerCase().includes(qLower))
      );
    }
    
    // Map to expected schema in explore.tsx (id, name, description, price, image_url)
    const results = products.map(p => ({
      id: p.id,
      name: p.title,
      description: p.description || '',
      price: p.base_price,
      image_url: p.image_url || ''
    }));

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
