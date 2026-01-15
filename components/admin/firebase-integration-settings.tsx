"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { AlertCircle, CheckCircle, Save, RefreshCw, Beaker } from "lucide-react"
import { testFirebaseConfig } from "@/app/actions/admin"

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  serverKey?: string
  serviceAccountJson?: string
}

export function FirebaseIntegrationSettings() {
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    serverKey: "",
    serviceAccountJson: "",
  })
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [jsonConfig, setJsonConfig] = useState("")
  const [activeTab, setActiveTab] = useState("form")
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    if (activeTab === "json") {
      setJsonConfig(JSON.stringify(config, null, 2))
    }
  }, [activeTab, config])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("platform_integrations")
        .select("config, is_enabled")
        .eq("service_name", "firebase")
        .single()

      if (error) {
        console.error("Erro ao carregar configuração:", error)
        return
      }

      if (data) {
        setConfig(data.config as FirebaseConfig)
        setIsEnabled(data.is_enabled)
      }
    } catch (err) {
      console.error("Erro ao carregar configuração:", err)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)

      let configToSave = config
      if (activeTab === "json") {
        try {
          configToSave = JSON.parse(jsonConfig)
        } catch (err) {
          toast({
            title: "Erro no formato JSON",
            description: "O JSON fornecido não é válido",
            variant: "destructive",
          })
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from("platform_integrations")
        .update({
          config: configToSave,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq("service_name", "firebase")

      if (error) {
        toast({
          title: "Erro ao salvar",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setConfig(configToSave)
      toast({
        title: "Configuração salva",
        description: "As configurações do Firebase foram atualizadas com sucesso",
        variant: "default",
      })
    } catch (err) {
      console.error("Erro ao salvar configuração:", err)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as configurações",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof FirebaseConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleJsonChange = (value: string) => {
    setJsonConfig(value)
  }

  const testConfiguration = async () => {
    try {
      setTesting(true)
      toast({
        title: "Iniciando teste",
        description: "A validar a configuração do Firebase...",
      })

      const result = await testFirebaseConfig({
        projectId: config.projectId,
        serviceAccountJson: config.serviceAccountJson,
        serverKey: config.serverKey,
      })

      if (result.success && result.results) {
        const { v1, legacy } = result.results

        toast({
          title: "Resultados do Teste",
          description: (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${v1.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs font-semibold">FCM V1:</span>
                <span className="text-xs">{v1.message}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${legacy.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs font-semibold">FCM Legacy:</span>
                <span className="text-xs">{legacy.message}</span>
              </div>
            </div>
          ),
          variant: (v1.success || legacy.success) ? "default" : "destructive",
        })
      } else {
        toast({
          title: "Erro no teste",
          description: result.error || "Ocorreu um erro inesperado durante o teste.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: `Falha ao executar o teste: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando configurações...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Configuração do Firebase Cloud Messaging</CardTitle>
            <CardDescription>Configure as credenciais do Firebase para habilitar notificações push</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">{isEnabled ? "Ativado" : "Desativado"}</span>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="form">Formulário</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="help">Ajuda</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  value={config.apiKey}
                  onChange={(e) => handleChange("apiKey", e.target.value)}
                  placeholder="AIzaSyC..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectId">Project ID</Label>
                <Input
                  id="projectId"
                  value={config.projectId}
                  onChange={(e) => handleChange("projectId", e.target.value)}
                  placeholder="biskate-12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authDomain">Auth Domain</Label>
                <Input
                  id="authDomain"
                  value={config.authDomain}
                  onChange={(e) => handleChange("authDomain", e.target.value)}
                  placeholder="biskate-12345.firebaseapp.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageBucket">Storage Bucket</Label>
                <Input
                  id="storageBucket"
                  value={config.storageBucket}
                  onChange={(e) => handleChange("storageBucket", e.target.value)}
                  placeholder="biskate-12345.appspot.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
                <Input
                  id="messagingSenderId"
                  value={config.messagingSenderId}
                  onChange={(e) => handleChange("messagingSenderId", e.target.value)}
                  placeholder="123456789012"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appId">App ID</Label>
                <Input
                  id="appId"
                  value={config.appId}
                  onChange={(e) => handleChange("appId", e.target.value)}
                  placeholder="1:123456789012:web:abc123def456"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="serviceAccountJson">Service Account JSON (V1 API)</Label>
              <Textarea
                id="serviceAccountJson"
                value={config.serviceAccountJson || ""}
                onChange={(e) => handleChange("serviceAccountJson", e.target.value)}
                placeholder='{ "type": "service_account", "project_id": ... }'
                className="font-mono h-[200px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para a API V1, é necessário o JSON da Service Account.
                (Firebase Console {'>'} Configurações do Projeto {'>'} Contas de serviço {'>'} Gerar nova chave privada)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="json">
            <div className="space-y-2">
              <Label htmlFor="jsonConfig">Configuração em JSON</Label>
              <Textarea
                id="jsonConfig"
                value={jsonConfig}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="font-mono h-[300px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="help">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Como configurar o Firebase Cloud Messaging</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal pl-5 space-y-2 mt-2">
                    <li>
                      Acesse o{" "}
                      <a
                        href="https://console.firebase.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Firebase Console
                      </a>
                    </li>
                    <li>Crie um novo projeto ou selecione um existente</li>
                    <li>Adicione um app web ao seu projeto</li>
                    <li>Copie as credenciais fornecidas para o formulário ao lado</li>
                    <li>
                      Para obter a Server Key, vá para Configurações do Projeto &gt; Cloud Messaging &gt; Server Key
                    </li>
                  </ol>
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Configuração do Service Worker</AlertTitle>
                <AlertDescription>
                  <p className="mt-2">
                    Para que as notificações push funcionem corretamente, é necessário configurar um Service Worker. O
                    BISKATE já possui esta configuração implementada automaticamente.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadConfig} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          <Button
            variant="outline"
            onClick={testConfiguration}
            disabled={saving || testing || !isEnabled}
          >
            {testing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Beaker className="h-4 w-4 mr-2" />
            )}
            Testar configuração
          </Button>
        </div>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar configuração
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
