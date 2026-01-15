import { siteConfig, getFullUrl } from "@/lib/config/site-config"

export interface StructuredDataConfig {
  type: "Organization" | "WebSite" | "Service" | "LocalBusiness" | "Article" | "BreadcrumbList"
  data: any
}

export class StructuredDataService {
  // Organização principal
  static generateOrganization(): string {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${siteConfig.url}#organization`,
        name: siteConfig.name,
        alternateName: "Biskate Portugal",
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          url: getFullUrl("/logo.png"),
          width: 512,
          height: 512,
        },
        image: getFullUrl(siteConfig.seo.defaultImage),
        description: siteConfig.description,
        foundingDate: "2024",
        founders: [
          {
            "@type": "Person",
            name: "Biskate Team",
          },
        ],
        address: {
          "@type": "PostalAddress",
          addressCountry: "PT",
          addressLocality: "Portugal",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+351-XXX-XXX-XXX",
            contactType: "customer service",
            availableLanguage: ["Portuguese", "English"],
            areaServed: "PT",
          },
        ],
        sameAs: [
          "https://twitter.com/biskate_app",
          "https://facebook.com/biskate",
          "https://instagram.com/biskate_app",
          "https://pinterest.com/biskate_app",
          "https://linkedin.com/company/biskate",
        ],
        knowsAbout: [
          "Serviços Domésticos",
          "Reparações",
          "Limpeza",
          "Jardinagem",
          "Transporte",
          "Tecnologia",
          "Cuidados com Animais",
        ],
      },
      null,
      2,
    )
  }

  // Website principal
  static generateWebSite(): string {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${siteConfig.url}#website`,
        url: siteConfig.url,
        name: siteConfig.title,
        description: siteConfig.description,
        publisher: {
          "@id": `${siteConfig.url}#organization`,
        },
        potentialAction: [
          {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${siteConfig.url}/dashboard?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        ],
        inLanguage: "pt-PT",
      },
      null,
      2,
    )
  }

  // Negócio local
  static generateLocalBusiness(): string {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${siteConfig.url}#localbusiness`,
        name: siteConfig.name,
        image: getFullUrl(siteConfig.seo.defaultImage),
        description: "Plataforma digital que conecta pessoas da comunidade para serviços locais em Portugal",
        url: siteConfig.url,
        telephone: "+351-XXX-XXX-XXX",
        address: {
          "@type": "PostalAddress",
          addressCountry: "PT",
          addressLocality: "Portugal",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 39.3999,
          longitude: -8.2245,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            opens: "00:00",
            closes: "23:59",
          },
        ],
        serviceArea: {
          "@type": "Country",
          name: "Portugal",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Serviços Biskate",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Serviços de Limpeza",
                description: "Limpeza doméstica e comercial",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Reparações Domésticas",
                description: "Pequenas reparações e manutenção",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Jardinagem",
                description: "Cuidados com jardins e plantas",
              },
            },
          ],
        },
      },
      null,
      2,
    )
  }

  // Serviço específico
  static generateService(service: {
    name: string
    description: string
    price?: number
    location?: string
    provider?: string
    rating?: number
    reviewCount?: number
  }): string {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.name,
        description: service.description,
        provider: service.provider
          ? {
              "@type": "Person",
              name: service.provider,
            }
          : {
              "@id": `${siteConfig.url}#organization`,
            },
        areaServed: service.location
          ? {
              "@type": "Place",
              name: service.location,
            }
          : {
              "@type": "Country",
              name: "Portugal",
            },
        offers: service.price
          ? {
              "@type": "Offer",
              price: service.price,
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
            }
          : undefined,
        aggregateRating: service.rating
          ? {
              "@type": "AggregateRating",
              ratingValue: service.rating,
              reviewCount: service.reviewCount || 1,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
        serviceType: "Serviços Locais",
        category: "Serviços Domésticos",
      },
      null,
      2,
    )
  }

  // Breadcrumbs
  static generateBreadcrumbs(items: Array<{ name: string; url: string }>): string {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: getFullUrl(item.url),
        })),
      },
      null,
      2,
    )
  }

  // FAQ
  static generateFAQ(faqs: Array<{ question: string; answer: string }>): string {
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      null,
      2,
    )
  }

  // Combinar múltiplos structured data
  static combineStructuredData(dataArray: string[]): string {
    const parsedData = dataArray.map((data) => JSON.parse(data))
    return JSON.stringify(parsedData, null, 2)
  }
}
