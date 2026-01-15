"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, AlertTriangle, FileText, Settings, Database, Activity } from "lucide-react"
import { UsersManagementComplete } from "@/components/admin/users-management-complete"
import { GigsManagementComplete } from "@/components/admin/gigs-management-complete"
import { CMSManagement } from "@/components/admin/cms-management"
import { SystemOverview } from "@/components/admin/system-overview"

export default function CompleteSystemPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Sistema Administrativo Completo</h1>
          <p className="text-gray-600 mt-2">
            Gestão completa da plataforma Biskate com acesso a todas as funcionalidades
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilizadores
            </TabsTrigger>
            <TabsTrigger value="gigs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Biskates
            </TabsTrigger>
            <TabsTrigger value="cms" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CMS
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Moderação
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SystemOverview />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagementComplete />
          </TabsContent>

          <TabsContent value="gigs">
            <GigsManagementComplete />
          </TabsContent>

          <TabsContent value="cms">
            <CMSManagement />
          </TabsContent>

          <TabsContent value="moderation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Sistema de Moderação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sistema de Moderação</h3>
                  <p className="text-gray-500 mb-4">Gerir alertas de moderação e conteúdo reportado</p>
                  <Badge variant="secondary">Em Desenvolvimento</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Estado da Base de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tabelas Principais</span>
                      <Badge variant="secondary">18+</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">RLS Ativo</span>
                      <Badge variant="secondary">✓</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Políticas Admin</span>
                      <Badge variant="secondary">✓</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Função is_admin()</span>
                      <Badge variant="secondary">Corrigida</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Autenticação Supabase</span>
                      <Badge variant="secondary">Ativo</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sistema de Notificações</span>
                      <Badge variant="secondary">Ativo</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">CMS Integrado</span>
                      <Badge variant="secondary">Ativo</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Push Notifications</span>
                      <Badge variant="secondary">Configurado</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
