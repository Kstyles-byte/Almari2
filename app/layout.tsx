import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "@/components/providers/AuthProvider";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { PageWrapper } from "../components/layout/page-wrapper";
import { RealtimeNotificationProvider } from "@/components/notifications/realtime-notification-provider";
import { ConditionalLayout } from "@/components/layout/conditional-layout";

// Initialize the Inter font with Latin subset
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Configure Montserrat
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: 'Zervia - Campus Marketplace',
  description: 'Your one-stop shop for everything you need on campus.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} font-sans`}>
      <body className="min-h-screen bg-zervia-50 antialiased flex flex-col">
        <AuthProvider>
          <LoadingProvider>
            <CartProvider>
              <RealtimeNotificationProvider enablePush={true} enableRealtime={true}>
                <ConditionalLayout>
                  <PageWrapper>{children}</PageWrapper>
                </ConditionalLayout>
                <Toaster />
              </RealtimeNotificationProvider>
            </CartProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 