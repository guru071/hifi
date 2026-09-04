import styles from "@/styles/static.module.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function FAQ() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={`${styles.staticContainer} glass-panel`}>
          <h1 className={styles.title}>Frequently Asked Questions</h1>
          
          <div className={styles.content}>
            <h2>Orders & Shipping</h2>
            <h3>How long does shipping take?</h3>
            <p>For standard in-stock items, shipping usually takes 3-5 business days. Custom printed designs require an additional 2-3 business days for production.</p>
            
            <h3>Do you ship internationally?</h3>
            <p>Yes, we ship globally. International shipping rates are calculated at checkout based on your destination and chosen delivery speed.</p>
            
            <h2>Custom Designs</h2>
            <h3>How do I submit my custom artwork?</h3>
            <p>You can generate a design reference code on any customizable product page, which will open a WhatsApp chat directly with our team. Send your high-resolution image there, and our team will approve it for printing.</p>
            
            <h3>What file formats do you accept?</h3>
            <p>We recommend PNG or JPG files with a minimum resolution of 300 DPI for the best print quality. Transparent backgrounds are preferred for non-square designs.</p>
            
            <h2>Returns</h2>
            <h3>What is your return policy?</h3>
            <p>We accept returns on unwashed, unworn standard items within 30 days of delivery. Please note that custom-printed items are final sale and cannot be returned unless there is a manufacturing defect. For more details, see our <a href="/returns">Returns Policy</a>.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
