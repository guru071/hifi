import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function CheckoutFailurePage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', width: '100%', borderColor: 'var(--color-error)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-error)', marginBottom: '1rem' }}>error</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Payment Failed</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: '2rem' }}>
            Unfortunately, your payment could not be processed. Your account has not been charged.
          </p>
          <Link href="/checkout" style={{ display: 'inline-block', padding: '1rem 2rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-full)', fontWeight: 600, textDecoration: 'none' }}>
            Try Again
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
