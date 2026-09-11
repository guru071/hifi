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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hificustom.goatech.tech"),
  title: {
    default: "HIFI CUSTOM PRINTING | Personalized & Stylish Custom Apparel",
    template: "%s | HIFI CUSTOM PRINTING",
  },
  description: "HIFI CUSTOM PRINTING is your destination for personalized custom printing in Thirukkanur, Puducherry. From custom T-shirts to oversized and acid-wash styles, we turn your creativity into wearable fashion.",
  keywords: ["custom t-shirts", "apparel printing", "oversized t-shirts", "acid-wash shirts", "custom clothing", "HIFI custom printing", "Thirukkanur", "Puducherry", "GOAT'ECH", "Abdul Kapur"],
  authors: [{ name: "Abdul Kapur", url: "https://instagram.com/_abdul_official_35t" }],
  creator: "Abdul Kapur",
  publisher: "GOAT'ECH",
  openGraph: {
    title: "HIFI CUSTOM PRINTING",
    description: "HIFI CUSTOM PRINTING is your destination for personalized and stylish custom printing. We create unique designs on T-shirts and apparel based on your ideas.",
    url: "/",
    siteName: "HIFI CUSTOM PRINTING",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HIFI CUSTOM PRINTING",
    description: "We create unique designs on T-shirts and apparel based on your ideas. Quality printing and customer satisfaction are our priority.",
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
        "name": "HIFI CUSTOM PRINTING",
        "legalName": "HIFI CUSTOM PRINTING",
        "url": "https://hificustom.goatech.tech",
        "logo": "https://hificustom.goatech.tech/logo.jpeg",
        "image": "https://hificustom.goatech.tech/logo.jpeg",
        "description": "HIFI CUSTOM PRINTING is your destination for personalized and stylish custom printing. We create unique designs on T-shirts and apparel based on your ideas. From custom T-shirts to oversized, drop-shoulder, and acid-wash styles, we help you turn your creativity into wearable fashion. Quality printing, creative designs, and customer satisfaction are our priority.",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Thirukkanur",
          "addressRegion": "Puducherry",
          "addressCountry": "IN"
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "email": "hificustomprinting@gmail.com",
            "contactType": "customer support"
          },
          {
            "@type": "ContactPoint",
            "email": "support@goatech.tech",
            "contactType": "technical support"
          },
          {
            "@type": "ContactPoint",
            "telephone": "+91-9655410150",
            "contactType": "customer support"
          },
          {
            "@type": "ContactPoint",
            "telephone": "+91-9488731106",
            "contactType": "bot support"
          }
        ],
        "parentOrganization": {
          "@type": "Organization",
          "name": "GOAT'ECH",
          "url": "https://goatech.tech"
        },
        "founder": {
          "@type": "Person",
          "@id": "https://hificustom.goatech.tech/#founder",
          "name": "Abdul Kapur",
          "jobTitle": "Founder",
          "sameAs": [
            "https://instagram.com/_abdul_official_35t"
          ]
        },
        "sameAs": [
          "https://instagram.com/hifi_custom_"
        ]
      },
      {
        "@type": "Person",
        "@id": "https://hificustom.goatech.tech/#founder",
        "name": "Abdul Kapur",
        "jobTitle": "Founder of HIFI CUSTOM PRINTING",
        "worksFor": {
          "@id": "https://hificustom.goatech.tech/#organization"
        },
        "sameAs": [
          "https://instagram.com/_abdul_official_35t"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://hificustom.goatech.tech/#website",
        "url": "https://hificustom.goatech.tech",
        "name": "HIFI CUSTOM PRINTING",
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
