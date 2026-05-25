export const dynamic = 'force-dynamic';

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ReduxProvider } from '@/store/provider';
import { I18nProvider } from '@/lib/i18n';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Nexus — Hire Top Freelancers & Agencies',
    template: '%s | Nexus',
  },
  description:
    'Nexus connects businesses with world-class freelancers and agencies. Post projects, get bids, manage contracts, and pay with escrow protection.',
  keywords: ['freelance', 'hire', 'agency', 'remote work', 'contract', 'marketplace'],
  authors: [{ name: 'Nexus Team' }],
  creator: 'Nexus',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nexus.io',
    title: 'Nexus — Hire Top Freelancers & Agencies',
    description: 'Connect with world-class freelancers and agencies',
    siteName: 'Nexus',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus — Hire Top Freelancers & Agencies',
    description: 'Connect with world-class freelancers and agencies',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <I18nProvider>
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
              toastOptions={{
                style: { borderRadius: '8px' },
              }}
            />
          </ThemeProvider>
        </ReduxProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
