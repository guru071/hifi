import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import AnalyticsProvider from "@/components/providers/AnalyticsProvider";
import PhoneWarningBanner from "@/components/layout/PhoneWarningBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});


export const viewport: import('next').Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hificustoms.com"),
  title: {
    default: "HIFI E-commerce | Premium Custom T-Shirts",
    template: "%s | HIFI E-commerce",
  },
  description: "Create and order premium custom T-shirts instantly. We turn your designs into high-quality apparel.",
  keywords: ["custom t-shirts", "premium blanks", "apparel printing", "custom clothing", "HIFI customs", "GOAT'ECH", "Maghgo", "Abdul Kapur"],
  authors: [{ name: "Abdul Kapur" }],
  creator: "GOAT'ECH",
  publisher: "Maghgo",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://hificustom.goatech.tech/#organization",
        "name": "HIFI Premium Customs",
        "legalName": "Maghgo",
        "url": "https://hificustom.goatech.tech",
        "logo": "https://hificustom.goatech.tech/logo.jpeg",
        "image": "https://hificustom.goatech.tech/logo.jpeg",
        "description": "Create and order premium custom T-shirts instantly. Powered by GOAT'ECH.",
        "parentOrganization": {
          "@type": "Organization",
          "name": "GOAT'ECH",
          "url": "https://goatech.tech"
        },
        "founder": {
          "@type": "Person",
          "name": "Abdul Kapur",
          "jobTitle": "Founder & CEO",
          "url": "https://hificustom.goatech.tech",
          "worksFor": {
            "@id": "https://hificustom.goatech.tech/#organization"
          }
        },
        "sameAs": [
          "https://instagram.com/hificustoms",
          "https://twitter.com/hificustoms"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://hificustom.goatech.tech/#website",
        "url": "https://hificustom.goatech.tech",
        "name": "HIFI E-commerce",
        "publisher": {
          "@id": "https://hificustom.goatech.tech/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://hificustom.goatech.tech/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };


  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
              <PhoneWarningBanner />
              {children}
            </CartProvider>
          </AuthProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
