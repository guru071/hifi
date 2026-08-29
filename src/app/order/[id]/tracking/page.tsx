import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
  
  if (!order) return notFound();

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', padding: '8rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <Link href={`/order/${id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>&larr; Back to Order</Link>
          </div>
          <div className="glass-panel" style={{ padding: '3rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Track Order #{id.slice(0, 8)}</h1>
            <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: '3rem' }}>Current Status: <strong style={{ color: 'var(--color-primary)', textTransform: 'capitalize' }}>{order.status}</strong></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', borderLeft: '2px solid var(--color-surface-dim)', marginLeft: '1rem', paddingLeft: '2rem', position: 'relative' }}>
              
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-2.6rem', top: '0.2rem', width: '1rem', height: '1rem', backgroundColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
                <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Order Placed</h3>
                <p style={{ color: 'var(--color-on-surface-variant)' }}>{new Date(order.created_at || '').toLocaleString()}</p>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-2.6rem', top: '0.2rem', width: '1rem', height: '1rem', backgroundColor: order.status !== 'pending' ? 'var(--color-primary)' : 'var(--color-surface-dim)', borderRadius: '50%' }}></div>
                <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Payment Confirmed</h3>
                <p style={{ color: 'var(--color-on-surface-variant)' }}>{order.payment_status}</p>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-2.6rem', top: '0.2rem', width: '1rem', height: '1rem', backgroundColor: (order.status === 'shipped' || order.status === 'delivered') ? 'var(--color-primary)' : 'var(--color-surface-dim)', borderRadius: '50%' }}></div>
                <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Shipped</h3>
                <p style={{ color: 'var(--color-on-surface-variant)' }}>Waiting for carrier pickup.</p>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-2.6rem', top: '0.2rem', width: '1rem', height: '1rem', backgroundColor: order.status === 'delivered' ? 'var(--color-primary)' : 'var(--color-surface-dim)', borderRadius: '50%' }}></div>
                <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Delivered</h3>
                <p style={{ color: 'var(--color-on-surface-variant)' }}>Expected soon.</p>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
