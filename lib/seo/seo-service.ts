import type { Metadata } from "next"

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
  private static baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://biskate.com"
  private static siteName = "Biskate"
  private static defaultImage = "/og-image.png"

  static generateMetadata(config: SEOConfig): Metadata {
    const {
      title,
      description,
      keywords = [],
      image = this.defaultImage,
      url = "",
      type = "website",
      author,
      publishedTime,
      modifiedTime,
    } = config

    const fullTitle = title.includes(this.siteName) ? title : `${title} | ${this.siteName}`
    const fullUrl = `${this.baseUrl}${url}`
    const fullImage = image.startsWith("http") ? image : `${this.baseUrl}${image}`

    return {
      title: fullTitle,
      description,
      keywords: keywords.join(", "),
      authors: author ? [{ name: author }] : undefined,
      creator: author,
      publisher: this.siteName,

      // Open Graph
      openGraph: {
        title: fullTitle,
        description,
        url: fullUrl,
        siteName: this.siteName,
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
        creator: "@biskate_app",
        site: "@biskate_app",
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

  // Gerar structured data (JSON-LD)
  static generateStructuredData(type: string, data: any): string {
    const baseStructure = {
      "@context": "https://schema.org",
      "@type": type,
      ...data,
    }

    return JSON.stringify(baseStructure, null, 2)
  }

  // Structured data para serviços
  static generateServiceStructuredData(service: {
    name: string
    description: string
    provider: string
    price?: number
    location?: string
    rating?: number
    reviewCount?: number
  }): string {
    return this.generateStructuredData("Service", {
      name: service.name,
      description: service.description,
      provider: {
        "@type": "Person",
        name: service.provider,
      },
      offers: service.price
        ? {
            "@type": "Offer",
            price: service.price,
            priceCurrency: "BRL",
          }
        : undefined,
      areaServed: service.location
        ? {
            "@type": "Place",
            name: service.location,
          }
        : undefined,
      aggregateRating: service.rating
        ? {
            "@type": "AggregateRating",
            ratingValue: service.rating,
            reviewCount: service.reviewCount || 1,
          }
        : undefined,
    })
  }

  // Structured data para organização
  static generateOrganizationStructuredData(): string {
    return this.generateStructuredData("Organization", {
      name: this.siteName,
      url: this.baseUrl,
      logo: `${this.baseUrl}/logo.png`,
      description: "Plataforma que conecta clientes a prestadores de serviços locais",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+55-11-99999-9999",
        contactType: "customer service",
        availableLanguage: ["Portuguese", "English"],
      },
      sameAs: [
        "https://facebook.com/biskate",
        "https://twitter.com/biskate_app",
        "https://instagram.com/biskate_app",
        "https://linkedin.com/company/biskate",
      ],
    })
  }
}
