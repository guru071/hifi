import type { NextConfig } from 'next';

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://apis.google.com https://accounts.google.com https://hifi-6f926.firebaseapp.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://zxvzbuiavxhqkrczxstj.supabase.co https://hificustom.goatech.tech https://lh3.googleusercontent.com https://*.googleusercontent.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://zxvzbuiavxhqkrczxstj.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://hifi-6f926.firebaseapp.com;
  frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://hifi-6f926.firebaseapp.com https://accounts.google.com https://hificustom.goatech.tech;
  frame-ancestors 'self' https://hificustom.goatech.tech;
`;

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim() },
  // Removed X-Frame-Options: DENY to allow Firebase Auth popups to communicate
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        // Replace with your actual firebase project ID from frame-src
        destination: 'https://hifi-6f926.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zxvzbuiavxhqkrczxstj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
