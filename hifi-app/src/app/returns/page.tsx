import styles from "@/styles/static.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function Returns() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={`${styles.staticContainer} glass-panel`}>
          <h1 className={styles.title}>Returns & Exchanges</h1>
          
          <div className={styles.content}>
            <p>We want you to be completely satisfied with your HIFI purchase. Please review our policies below regarding returns and exchanges.</p>
            
            <h2>Standard Items</h2>
            <p>Unworn, unwashed standard items in their original condition may be returned within 30 days of delivery for a full refund or exchange. Shipping costs are non-refundable.</p>
            
            <h2>Custom Items</h2>
            <p>Because custom items are made specifically for you, they are <strong>final sale</strong>. We cannot accept returns or exchanges on customized products unless the item is defective or there was an error in production.</p>
            
            <h2>Defective or Incorrect Items</h2>
            <p>If you receive a defective item or an item different from what you ordered, please contact our support team within 7 days of receiving your order. We will arrange a replacement at no additional cost to you.</p>
            
            <h2>How to Initiate a Return</h2>
            <p>To start a return, please <a href="/contact">contact our support team</a> with your order number and the reason for the return. We will provide you with a return authorization and shipping instructions.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
