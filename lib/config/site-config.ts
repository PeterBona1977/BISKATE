export const siteConfig = {
  name: "Biskate",
  title: "Biskate - Plataforma de Serviços Locais em Portugal",
  description:
    "Conecte-se com prestadores de serviços locais de forma rápida e segura. Limpeza, reparações, jardinagem e muito mais em Portugal.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://v0-biskate.vercel.app",

  // SEO específico
  seo: {
    defaultImage: "/og-image.png",
    twitterHandle: "@biskate_app",
    keywords: [
      "serviços locais portugal",
      "prestadores de serviços",
      "limpeza doméstica",
      "reparações casa",
      "jardinagem portugal",
      "serviços comunidade",
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
    email: "hello@biskate.pt",
    phone: "+351-XXX-XXX-XXX",
    address: "Portugal",
  },

  // Redes sociais
  social: {
    twitter: "https://twitter.com/biskate_app",
    facebook: "https://facebook.com/biskate",
    instagram: "https://instagram.com/biskate_app",
    pinterest: "https://pinterest.com/biskate_app",
    linkedin: "https://linkedin.com/company/biskate",
  },
}

export function getFullUrl(path: string): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`
}
