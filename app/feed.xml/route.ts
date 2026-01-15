import { NextResponse } from "next/server"
import { siteConfig, getFullUrl } from "@/lib/config/site-config"

export async function GET() {
  const rssItems = [
    {
      title: "Bem-vindo ao Biskate",
      description: "Conecte-se com prestadores de serviços locais de forma rápida e segura.",
      link: getFullUrl("/"),
      pubDate: new Date("2024-01-15").toUTCString(),
      guid: getFullUrl("/welcome"),
    },
    {
      title: "Como funciona o Biskate",
      description: "Descubra como encontrar e contratar serviços na sua comunidade.",
      link: getFullUrl("/como-funciona"),
      pubDate: new Date("2024-01-20").toUTCString(),
      guid: getFullUrl("/como-funciona"),
    },
    {
      title: "Torne-se um Prestador de Serviços",
      description: "Ganhe dinheiro oferecendo seus serviços através do Biskate.",
      link: getFullUrl("/prestador"),
      pubDate: new Date("2024-01-25").toUTCString(),
      guid: getFullUrl("/prestador"),
    },
    {
      title: "Dicas de Segurança",
      description: "Como usar o Biskate de forma segura e proteger-se de fraudes.",
      link: getFullUrl("/seguranca"),
      pubDate: new Date("2024-02-01").toUTCString(),
      guid: getFullUrl("/seguranca"),
    },
    {
      title: "Categorias de Serviços Disponíveis",
      description: "Explore todas as categorias de serviços disponíveis no Biskate.",
      link: getFullUrl("/categorias"),
      pubDate: new Date("2024-02-10").toUTCString(),
      guid: getFullUrl("/categorias"),
    },
  ]

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.title}</title>
    <description>${siteConfig.description}</description>
    <link>${siteConfig.url}</link>
    <language>pt-PT</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${getFullUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>
    <managingEditor>${siteConfig.contact.email} (Biskate Team)</managingEditor>
    <webMaster>${siteConfig.contact.email} (Biskate Team)</webMaster>
    <category>Serviços</category>
    <category>Comunidade</category>
    <category>Trabalho</category>
    <ttl>60</ttl>
    <image>
      <url>${getFullUrl("/og-image.png")}</url>
      <title>${siteConfig.title}</title>
      <link>${siteConfig.url}</link>
      <width>144</width>
      <height>144</height>
    </image>
    ${rssItems
      .map(
        (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <category>Biskate</category>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
