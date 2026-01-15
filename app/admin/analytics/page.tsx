"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardCharts } from "@/components/admin/dashboard-charts"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AnalyticsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExportData = async () => {
    setIsExporting(true)

    // Simulação de exportação
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsExporting(false)
    toast({
      title: "Relatório exportado",
      description: "O relatório foi exportado com sucesso para CSV",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Relatórios</h1>
          <p className="text-gray-500 mt-1">Visualize e exporte dados da plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExportData} disabled={isExporting} size="sm">
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <DashboardCharts />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Relatórios Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Relatório de Utilizadores</p>
                    <p className="text-sm text-gray-500">Dados completos de todos os utilizadores</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Relatório de Biskates</p>
                    <p className="text-sm text-gray-500">Todos os biskates e suas métricas</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Relatório de Respostas</p>
                    <p className="text-sm text-gray-500">Análise de todas as respostas</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agendamento de Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-dashed rounded-lg text-center">
                  <p className="text-gray-500">Configure relatórios automáticos por email</p>
                  <Button className="mt-4" variant="outline">
                    Configurar Agendamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
