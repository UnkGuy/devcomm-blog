import type { Metadata } from 'next';
import { Cinzel, EB_Garamond, JetBrains_Mono } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { FaviconRandomizer } from '@/components/layout/FaviconRandomizer';
import './globals.css';

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const garamond = EB_Garamond({
  variable: '--font-garamond',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: "Viggy's Archive",
  description: "Hand-Crafted for the Tabletop Community",
  icons: {
    icon: '/assets/images/wax-seal-red.png', // Fallback default
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${garamond.variable}${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased">
        <FaviconRandomizer />
        <Navbar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}