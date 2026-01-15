import Head from "next/head"
import { StructuredData } from "./structured-data"
import { siteConfig, getFullUrl } from "@/lib/config/site-config"

interface SEOHeadProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: "website" | "article" | "service"
  structuredDataType?: "homepage" | "service" | "gig" | "profile"
  structuredData?: any
  breadcrumbs?: Array<{ name: string; url: string }>
  noIndex?: boolean
}

export function SEOHead({
  title,
  description = siteConfig.description,
  image = siteConfig.seo.defaultImage,
  url = "",
  type = "website",
  structuredDataType = "homepage",
  structuredData,
  breadcrumbs,
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title
  const fullUrl = getFullUrl(url)
  const fullImage = image.startsWith("http") ? image : getFullUrl(image)

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={fullUrl} />

      {/* Robots */}
      <meta name="robots" content={noIndex ? "noindex,nofollow" : "index,follow"} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || siteConfig.title} />
      <meta property="og:locale" content="pt_PT" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:creator" content={siteConfig.seo.twitterHandle} />
      <meta name="twitter:site" content={siteConfig.seo.twitterHandle} />

      {/* Structured Data */}
      <StructuredData type={structuredDataType} data={structuredData} />

      {/* Breadcrumbs Structured Data */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: breadcrumbs.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                item: getFullUrl(item.url),
              })),
            }),
          }}
        />
      )}
    </Head>
  )
}
