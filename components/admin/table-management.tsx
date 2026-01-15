"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Users, Briefcase, Bell, AlertTriangle, FileText, ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface TableInfo {
  name: string
  count: number
  icon: any
  description: string
  lastUpdated?: string
}

export function TableManagement() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTableInfo()
  }, [])

  const fetchTableInfo = async () => {
    try {
      setLoading(true)

      const tableQueries = [
        { name: "profiles", icon: Users, description: "Perfis de utilizadores" },
        { name: "gigs", icon: Briefcase, description: "Biskates publicados" },
        { name: "gig_responses", icon: Bell, description: "Respostas aos biskates" },
        { name: "notifications", icon: Bell, description: "Notificações do sistema" },
        { name: "moderation_alerts", icon: AlertTriangle, description: "Alertas de moderação" },
        { name: "cms_pages", icon: FileText, description: "Páginas de conteúdo" },
        { name: "cms_media", icon: ImageIcon, description: "Ficheiros multimédia" },
        { name: "user_feedback", icon: Bell, description: "Feedback dos utilizadores" },
      ]

      const results = await Promise.all(
        tableQueries.map(async (table) => {
          try {
            const { count } = await supabase.from(table.name).select("*", { count: "exact", head: true })

            return {
              ...table,
              count: count || 0,
            }
          } catch (error) {
            console.warn(`Erro ao contar ${table.name}:`, error)
            return {
              ...table,
              count: 0,
            }
          }
        }),
      )

      setTables(results)
    } catch (error) {
      console.error("Erro ao carregar informações das tabelas:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Tabelas</h2>
          <p className="text-gray-500 mt-2">Visão geral de todas as tabelas da base de dados</p>
        </div>
        <Button onClick={fetchTableInfo} variant="outline">
          <Database className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <Card key={table.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <table.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <Badge variant="secondary">{table.count}</Badge>
              </div>
              <h3 className="font-semibold text-lg capitalize mb-2">{table.name.replace(/_/g, " ")}</h3>
              <p className="text-sm text-gray-600 mb-4">{table.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Registos</span>
                <span className="text-sm font-medium">{table.count}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando informações das tabelas...</p>
        </div>
      )}
    </div>
  )
}
