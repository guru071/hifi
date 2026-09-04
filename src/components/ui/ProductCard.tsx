import Link from "next/link";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  imageUrl: string;
  imageAlt: string;
  soldOut?: boolean;
  inr?: boolean;
}

export default function ProductCard({
  id,
  title,
  subtitle,
  price,
  imageUrl,
  imageAlt,
  soldOut,
  inr,
}: ProductCardProps) {
  return (
    <Link href={`/product/${id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={imageAlt} className={styles.image} />
        {soldOut ? (
          <div className={`${styles.badge} ${styles.badgeSoldOut}`}>Sold Out</div>
        ) : (
          <div className={`${styles.badge} glass-panel`}>Customizable</div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.footer}>
          <span className={styles.price}>{inr ? `₹${price.toFixed(2)}` : `$${price.toFixed(2)}`}</span>
        </div>
      </div>
    </Link>
  );
}
