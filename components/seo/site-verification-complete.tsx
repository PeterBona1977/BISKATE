import { siteConfig } from "@/lib/config/site-config"

export function SiteVerificationComplete() {
  return (
    <>
      {/* Google Search Console */}
      {siteConfig.verification.google && (
        <meta name="google-site-verification" content={siteConfig.verification.google} />
      )}

      {/* Bing Webmaster Tools - ATIVO */}
      <meta name="msvalidate.01" content="B128E07173F88C1FD2F70E3CAB33C87A" />

      {/* Yandex Webmaster */}
      {siteConfig.verification.yandex && <meta name="yandex-verification" content={siteConfig.verification.yandex} />}

      {/* Pinterest */}
      {siteConfig.verification.pinterest && <meta name="p:domain_verify" content={siteConfig.verification.pinterest} />}

      {/* Facebook Domain Verification */}
      {siteConfig.verification.facebook && (
        <meta name="facebook-domain-verification" content={siteConfig.verification.facebook} />
      )}

      {/* Robots meta - Configurações globais */}
      <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
      <meta name="googlebot" content="index,follow" />
      <meta name="bingbot" content="index,follow" />
      <meta name="yandexbot" content="index,follow" />

      {/* Canonical URL */}
      <link rel="canonical" href={siteConfig.url} />

      {/* Sitemap */}
      <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

      {/* RSS Feed */}
      <link rel="alternate" type="application/rss+xml" title="Biskate Blog" href="/feed.xml" />

      {/* Preconnect para performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* DNS Prefetch para recursos externos */}
      <link rel="dns-prefetch" href="//www.bing.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
    </>
  )
}
