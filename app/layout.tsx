import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner"
import { InstallPrompt } from "@/components/shared/install-prompt"
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

const inter = Inter({ subsets: ["latin"] })



export const metadata: Metadata = {
  title: "Biskate - Freelance Platform",
  description: "Connect with skilled professionals for your projects",
  manifest: "/manifest-v5.json",
  icons: {
    icon: "/biskate-icon-512.png",
    apple: "/biskate-icon-512.png",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="app-version" content="v-force-final-5" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.deferredPrompt = null;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPrompt = e;
                console.log('🚀 PWA: beforeinstallprompt captured globally');
                window.dispatchEvent(new CustomEvent('pwa-prompt-available', { detail: e }));
              });
              setTimeout(() => console.log('🚀 APP VERSION: v-force-final-5'), 100);
            `
          }}
        />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthProvider>
              {children}
              <Toaster />
              <CookieConsentBanner />
              <InstallPrompt />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw-v5.js').then(function(registration) {
                    console.log('SW (v5) registered with scope:', registration.scope);
                  }, function(err) {
                    console.log('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html >
  )
}
