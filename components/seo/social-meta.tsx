import { siteConfig, getFullUrl } from "@/lib/config/site-config"

interface SocialMetaProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: "website" | "article" | "profile" | "service"
  author?: string
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
  price?: number
  currency?: string
  availability?: "InStock" | "OutOfStock" | "PreOrder"
}

export function SocialMeta({
  title,
  description = siteConfig.description,
  image = siteConfig.seo.defaultImage,
  url = "",
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  tags = [],
  price,
  currency = "EUR",
  availability = "InStock",
}: SocialMetaProps) {
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title
  const fullUrl = getFullUrl(url)
  const fullImage = image.startsWith("http") ? image : getFullUrl(image)

  return (
    <>
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:locale" content="pt_PT" />
      <meta property="og:locale:alternate" content="pt_BR" />

      {/* Open Graph Images */}
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:secure_url" content={fullImage} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />

      {/* Article specific */}
      {type === "article" && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Product specific (for services) */}
      {type === "service" && price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
          <meta property="product:availability" content={availability} />
        </>
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={siteConfig.seo.twitterHandle} />
      <meta name="twitter:creator" content={siteConfig.seo.twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* Twitter App Card (for mobile apps) */}
      <meta name="twitter:app:name:iphone" content={siteConfig.name} />
      <meta name="twitter:app:name:ipad" content={siteConfig.name} />
      <meta name="twitter:app:name:googleplay" content={siteConfig.name} />

      {/* Facebook specific */}
      {/* Facebook App ID - Configurar quando criar conta Facebook Business */}
      {/* <meta property="fb:app_id" content={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""} /> */}

      {/* LinkedIn specific */}
      <meta property="og:see_also" content={siteConfig.social.linkedin} />

      {/* Pinterest specific */}
      <meta name="pinterest-rich-pin" content="true" />
      <meta property="og:rich_attachment" content="true" />
    </>
  )
}
