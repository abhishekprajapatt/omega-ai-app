import './globals.css';
import '../prism.css';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter, Syne } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ClerkProvider } from '@clerk/nextjs';
import { AppContextProvider } from '@/context/AppContext';
import SkeletonLoading from '@/components/SkeletonLoading';
import CookieConsent from '@/components/CookieConsent';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Omega',
  description: 'Chat AI',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <AppContextProvider>
        <html lang="en">
          <body className={`${inter.variable} ${syne.variable} antialiased`}>
            <Toaster
              toastOptions={{
                success: { style: { background: 'black', color: 'white' } },
                error: { style: { background: 'black', color: 'white' } },
              }}
            />
            <Suspense fallback={<SkeletonLoading />}>{children}</Suspense>
            <CookieConsent />
          </body>
        </html>
      </AppContextProvider>
    </ClerkProvider>
  );
}
