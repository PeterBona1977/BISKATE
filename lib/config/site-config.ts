export const siteConfig = {
  name: "GigHub",
  title: "GigHub - Plataforma de Serviços Locais em Portugal",
  description:
    "Conecte-se com prestadores de serviços locais de forma rápida e segura. Limpeza, reparações, jardinagem e muito mais em Portugal.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://gighub.pt",

  // SEO específico
  seo: {
    defaultImage: "/og-image.png",
    twitterHandle: "@gighub_app",
    keywords: [
      "serviços locais portugal",
      "prestadores de serviços",
      "limpeza doméstica",
      "reparações casa",
      "jardinagem portugal",
      "serviços comunidade",
      "gighub portugal",
    ],
  },

  // Verificações
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    bing: process.env.BING_SITE_VERIFICATION,
    pinterest: process.env.PINTEREST_VERIFICATION,
    facebook: process.env.FACEBOOK_DOMAIN_VERIFICATION,
  },

  // Contacto
  contact: {
    email: "support@gighub.pt",
    phone: "+351-XXX-XXX-XXX",
    address: "Portugal",
  },

  // Redes sociais
  social: {
    twitter: "https://twitter.com/gighub_app",
    facebook: "https://facebook.com/gighub",
    instagram: "https://instagram.com/gighub_app",
    pinterest: "https://pinterest.com/gighub_app",
    linkedin: "https://linkedin.com/company/gighub",
  },
}

export function getFullUrl(path: string): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`
}
