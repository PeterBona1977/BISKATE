import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, ImageIcon, Menu, Settings } from "lucide-react"

export function CMSManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Management System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pages">
            <TabsList className="mb-4">
              <TabsTrigger value="pages" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pages
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Media
              </TabsTrigger>
              <TabsTrigger value="menus" className="flex items-center gap-2">
                <Menu className="h-4 w-4" />
                Menus
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pages">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cmsPages.map((page) => (
                  <Card key={page.id} className="overflow-hidden">
                    <div className="p-4">
                      <h3 className="font-medium">{page.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{page.path}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={page.status === "published" ? "success" : "secondary"}>{page.status}</Badge>
                        <span className="text-xs text-gray-500">Last updated: {page.lastUpdated}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="media">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cmsMedia.map((media) => (
                  <Card key={media.id} className="overflow-hidden">
                    <div className="aspect-square bg-gray-100 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium truncate">{media.filename}</p>
                      <p className="text-xs text-gray-500">{media.type}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="menus">
              <div className="space-y-4">
                {cmsMenus.map((menu) => (
                  <Card key={menu.id}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">{menu.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <p className="text-gray-500">Key: {menu.key}</p>
                        <p className="text-gray-500 mt-1">Items: {menu.itemCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">CMS Settings</h3>
                    <p className="text-gray-500 mb-4">Manage global CMS system settings</p>
                    <Badge variant="secondary">Under Development</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Dados de exemplo
const cmsPages = [
  { id: 1, title: "Home Page", path: "/", status: "published", lastUpdated: "2023-10-15" },
  { id: 2, title: "About Us", path: "/sobre", status: "published", lastUpdated: "2023-09-22" },
  { id: 3, title: "Contacts", path: "/contactos", status: "draft", lastUpdated: "2023-10-10" },
  { id: 4, title: "Terms and Conditions", path: "/termos", status: "published", lastUpdated: "2023-08-05" },
  { id: 5, title: "Privacy Policy", path: "/privacidade", status: "published", lastUpdated: "2023-08-05" },
  { id: 6, title: "FAQ", path: "/faq", status: "draft", lastUpdated: "2023-10-18" },
]

const cmsMedia = [
  { id: 1, filename: "hero-image.jpg", type: "image/jpeg" },
  { id: 2, filename: "logo.png", type: "image/png" },
  { id: 3, filename: "background.jpg", type: "image/jpeg" },
  { id: 4, filename: "team-photo.jpg", type: "image/jpeg" },
  { id: 5, filename: "product-brochure.pdf", type: "application/pdf" },
  { id: 6, filename: "intro-video.mp4", type: "video/mp4" },
  { id: 7, filename: "icon-set.svg", type: "image/svg+xml" },
  {
    id: 8,
    filename: "presentation.pptx",
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
]

const cmsMenus = [
  { id: 1, title: "Main Menu", key: "main-menu", itemCount: 5 },
  { id: 2, title: "Footer Menu", key: "footer-menu", itemCount: 4 },
  { id: 3, title: "User Menu", key: "user-menu", itemCount: 3 },
  { id: 4, title: "Mobile Menu", key: "mobile-menu", itemCount: 6 },
]
