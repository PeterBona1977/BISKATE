"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { FirebaseIntegrationSettings } from "@/components/admin/firebase-integration-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function IntegrationsPage() {
  return (
    <AdminLayout activeTab="settings">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrações</h2>
          <p className="text-gray-600">Configure integrações com serviços externos</p>
        </div>

        <Tabs defaultValue="push-notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="push-notifications">Push Notifications</TabsTrigger>
            <TabsTrigger value="sms" disabled>
              SMS (Em breve)
            </TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="push-notifications" className="space-y-4">
            <FirebaseIntegrationSettings />
          </TabsContent>

          <TabsContent value="sms">
            <div className="bg-muted p-6 rounded-lg text-center">
              <h3 className="text-lg font-medium">Integração SMS</h3>
              <p className="text-muted-foreground mt-2">Esta funcionalidade estará disponível em breve.</p>
            </div>
          </TabsContent>

          <TabsContent value="email">
            <div className="bg-muted p-6 rounded-lg text-center">
              <h3 className="text-lg font-medium">Configurações de Email</h3>
              <p className="text-muted-foreground mt-2">O envio de emails está configurado através do Supabase Auth.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
