import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://v0-biskate.vercel.app"

  const routes = [
    "",
    "/login",
    "/register",
    "/dashboard",
    "/dashboard/create-gig",
    "/dashboard/my-gigs",
    "/dashboard/responses",
    "/dashboard/analytics",
    "/dashboard/profile",
    "/dashboard/settings",
    "/dashboard/provider",
    "/dashboard/provider/setup",
    "/dashboard/provider/profile",
    "/feed.xml", // Adicionar RSS feed ao sitemap
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : route === "/feed.xml" ? "daily" : ("weekly" as const),
    priority: route === "" ? 1 : route === "/feed.xml" ? 0.9 : 0.8,
  }))
}
