import type { MetadataRoute } from "next"
import { getFullUrl } from "@/lib/config/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/dashboard/", "/_next/", "/diagnostic/"],
    },
    sitemap: getFullUrl("/sitemap.xml"),
  }
}
