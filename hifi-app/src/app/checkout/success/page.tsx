import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', width: '100%' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-primary)', marginBottom: '1rem' }}>check_circle</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Payment Successful</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: '2rem' }}>
            Thank you for your order. We are preparing your custom items and will notify you once they ship.
          </p>
          <Link href="/profile/orders" style={{ display: 'inline-block', padding: '1rem 2rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-full)', fontWeight: 600, textDecoration: 'none' }}>
            View Orders
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
