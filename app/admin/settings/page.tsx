"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Database, Bell, Shield, Globe, Save, RefreshCw } from "lucide-react"
import { FirebaseIntegrationSettings } from "@/components/admin/firebase-integration-settings"
import { getPlatformSettings, updatePlatformSettings } from "@/app/actions/admin"
import { useToast } from "@/hooks/use-toast"
import { logClientActivity } from "@/app/actions/log"
import { useAuth } from "@/contexts/auth-context"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { profile } = useAuth()

  const [settings, setSettings] = useState({
    site_name: "GigHub",
    site_url: "https://gighub.com",
    site_description: "Plataforma de serviços freelance",
    maintenance_mode: false,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const result = await getPlatformSettings()
      if (result.success && result.settings) {
        setSettings({
          site_name: result.settings.site_name,
          site_url: result.settings.site_url,
          site_description: result.settings.site_description,
          maintenance_mode: result.settings.maintenance_mode,
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const result = await updatePlatformSettings(settings)
      if (result.success) {
        // Log the settings update
        if (profile) {
          logClientActivity(
            profile.id,
            profile.role,
            "UPDATE_SYSTEM_SETTINGS",
            settings
          )
        }

        toast({
          title: "Sucesso",
          description: "Configurações atualizadas com sucesso.",
        })
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao salvar configurações.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Erro ao salvar configurações:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Carregando configurações...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
          <p className="text-gray-500 mt-2">Configure as definições globais da plataforma GigHub.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Todas as Configurações
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>Definições básicas da plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Nome da Plataforma</Label>
                <Input
                  id="site-name"
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-url">URL da Plataforma</Label>
                <Input
                  id="site-url"
                  value={settings.site_url}
                  onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-description">Descrição</Label>
              <Input
                id="site-description"
                value={settings.site_description}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="maintenance-mode"
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
              />
              <Label htmlFor="maintenance-mode">Modo de Manutenção</Label>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Base de Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Dados
            </CardTitle>
            <CardDescription>Configurações de conexão e performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Estado da Conexão</p>
                <p className="text-sm text-gray-500">Supabase conectado</p>
              </div>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </div>
            <Separator />
            <div className="flex items-center space-x-2">
              <Switch id="auto-backup" defaultChecked />
              <Label htmlFor="auto-backup">Backup Automático</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="query-optimization" defaultChecked />
              <Label htmlFor="query-optimization">Otimização de Queries</Label>
            </div>
          </CardContent>
        </Card>

        {/* Integração Firebase */}
        <FirebaseIntegrationSettings />

        {/* Botões de Ação Inferiores */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={loadSettings}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Guardar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  )
}
