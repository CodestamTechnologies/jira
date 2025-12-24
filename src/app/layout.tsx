import type { Metadata } from 'next';
import { Antic } from 'next/font/google';
import type { PropsWithChildren } from 'react';

import { QueryProvider } from '@/components/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { siteConfig } from '@/config';
import { cn } from '@/lib/utils';

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const antic = Antic({
  subsets: ['latin'],
  weight: '400',
});

export const metadata: Metadata = siteConfig;

const RootLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(antic.className, 'min-h-screen antialiased')}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Skip to main content for accessibility */}
            <a href="#main-content" className="skip-to-main">
              Skip to main content
            </a>

            <Toaster />

            <div id="main-content">
              {children}
            </div>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
