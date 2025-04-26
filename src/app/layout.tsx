import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../../../components/theme-provider";
import { Header } from "../../../components/layout/header";
import { Footer } from "../../../components/layout/footer";
import { Toaster } from "../../../components/ui/toaster";
import { AuthProvider } from "../../../providers/auth-provider";

export const metadata: Metadata = {
  title: "Zervia - Multi-vendor E-commerce Platform",
  description: "Buy and sell products from multiple vendors with ease",
  keywords: ["e-commerce", "online shopping", "multi-vendor", "marketplace"],
  authors: [{ name: "Zervia Team" }],
  creator: "Zervia",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zervia.com",
    title: "Zervia - Multi-vendor E-commerce Platform",
    description: "Buy and sell products from multiple vendors with ease",
    siteName: "Zervia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zervia - Multi-vendor E-commerce Platform",
    description: "Buy and sell products from multiple vendors with ease",
    creator: "@zervia",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
