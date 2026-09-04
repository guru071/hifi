import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import AnalyticsProvider from "@/components/providers/AnalyticsProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hificustoms.com"),
  title: {
    default: "HIFI E-commerce | Premium Custom T-Shirts",
    template: "%s | HIFI E-commerce",
  },
  description: "Create and order premium custom T-shirts instantly. We turn your designs into high-quality apparel.",
  keywords: ["custom t-shirts", "premium blanks", "apparel printing", "custom clothing", "HIFI customs"],
  openGraph: {
    title: "HIFI Premium Customs",
    description: "Create and order premium custom T-shirts instantly.",
    url: "/",
    siteName: "HIFI E-commerce",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HIFI Premium Customs",
    description: "Create and order premium custom T-shirts instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Material Symbols is an icon font not exposed by next/font/google */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AnalyticsProvider>
          <AuthProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
