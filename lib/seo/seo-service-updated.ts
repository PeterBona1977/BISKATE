import type { Metadata } from "next"
import { siteConfig, getFullUrl } from "@/lib/config/site-config"

interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: "website" | "article" | "profile"
  author?: string
  publishedTime?: string
  modifiedTime?: string
}

export class SEOService {
  static generateMetadata(config: SEOConfig): Metadata {
    const {
      title,
      description,
      keywords = [],
      image = siteConfig.seo.defaultImage,
      url = "",
      type = "website",
      author,
      publishedTime,
      modifiedTime,
    } = config

    const fullTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`
    const fullUrl = getFullUrl(url)
    const fullImage = image.startsWith("http") ? image : getFullUrl(image)

    return {
      title: fullTitle,
      description,
      keywords: keywords.join(", "),
      authors: author ? [{ name: author }] : undefined,
      creator: author,
      publisher: siteConfig.name,

      // Open Graph
      openGraph: {
        title: fullTitle,
        description,
        url: fullUrl,
        siteName: siteConfig.name,
        images: [
          {
            url: fullImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        locale: "pt_BR",
        type,
        publishedTime,
        modifiedTime,
      },

      // Twitter
      twitter: {
        card: "summary_large_image",
        title: fullTitle,
        description,
        images: [fullImage],
        creator: siteConfig.seo.twitterHandle,
        site: siteConfig.seo.twitterHandle,
      },

      // Additional
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },

      alternates: {
        canonical: fullUrl,
        languages: {
          "pt-BR": fullUrl,
          "en-US": `${fullUrl}?lang=en`,
        },
      },

      verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
        yandex: process.env.YANDEX_VERIFICATION,
        yahoo: process.env.YAHOO_VERIFICATION,
      },
    }
  }

  // Gerar structured data para organização
  static generateOrganizationStructuredData(): string {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteConfig.name,
        url: siteConfig.url,
        logo: getFullUrl("/logo.png"),
        description: siteConfig.description,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: siteConfig.contact.phone,
          contactType: "customer service",
          availableLanguage: ["Portuguese", "English"],
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: siteConfig.contact.address,
          addressCountry: "BR",
        },
        sameAs: Object.values(siteConfig.social),
      },
      null,
      2,
    )
  }
}
