import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner"
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

const inter = Inter({ subsets: ["latin"] })



export const metadata: Metadata = {
  title: "Biskate - Freelance Platform",
  description: "Connect with skilled professionals for your projects",
  manifest: "/manifest.json",
  icons: {
    icon: "/biskate-logo.png",
    shortcut: "/biskate-logo.png",
    apple: "/biskate-logo.png",
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
        <meta name="app-version" content="v-debug-nuclear-2" />
      </head>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log('🚀 APP VERSION: v-debug-nuclear-2');`
          }}
        />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthProvider>
              {children}
              <Toaster />
              <CookieConsentBanner />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      console.log('Unregistering SW:', registration);
                      registration.unregister();
                    }
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
