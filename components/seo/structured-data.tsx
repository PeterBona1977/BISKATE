import { StructuredDataService } from "@/lib/seo/structured-data"

interface StructuredDataProps {
  type?: "homepage" | "service" | "gig" | "profile"
  data?: any
}

export function StructuredData({ type = "homepage", data }: StructuredDataProps) {
  const getStructuredData = () => {
    switch (type) {
      case "homepage":
        return StructuredDataService.combineStructuredData([
          StructuredDataService.generateOrganization(),
          StructuredDataService.generateWebSite(),
          StructuredDataService.generateLocalBusiness(),
        ])

      case "service":
        return StructuredDataService.generateService(data)

      case "gig":
        return StructuredDataService.generateService({
          name: data.title,
          description: data.description,
          price: data.price,
          location: data.location,
          provider: data.author_name,
        })

      default:
        return StructuredDataService.generateOrganization()
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: getStructuredData(),
      }}
    />
  )
}
