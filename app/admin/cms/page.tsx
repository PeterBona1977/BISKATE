import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLoading } from "@/components/ui/page-loading"
import {
  PagesManagement,
  SectionsManagement,
  MenusManagement,
  MediaManager,
} from "@/components/admin/lazy-admin-components"

export default function AdminCMSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistema de Gestão de Conteúdo</h1>
        <p className="text-gray-500 mt-2">Gira páginas, secções, menus e media do site</p>
      </div>

      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pages">Páginas</TabsTrigger>
          <TabsTrigger value="sections">Secções</TabsTrigger>
          <TabsTrigger value="menus">Menus</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <Suspense fallback={<PageLoading text="Carregando gestão de páginas..." />}>
            <PagesManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="sections">
          <Suspense fallback={<PageLoading text="Carregando gestão de secções..." />}>
            <SectionsManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="menus">
          <Suspense fallback={<PageLoading text="Carregando gestão de menus..." />}>
            <MenusManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="media">
          <Suspense fallback={<PageLoading text="Carregando gestor de media..." />}>
            <MediaManager />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
