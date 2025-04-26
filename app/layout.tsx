import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '../components/layout/header';
import Footer from '../components/layout/footer';
import { Preloader } from '../components/ui/preloader';

// Initialize the Inter font with Latin subset
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'Zervia - Multi-vendor E-commerce Platform',
  description: 'Shop the latest products from various vendors with our agent-based delivery system.',
  keywords: 'ecommerce, campus shopping, agent pickup, student shopping',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-zervia-50 font-sans antialiased flex flex-col">
        <Preloader />
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
} 