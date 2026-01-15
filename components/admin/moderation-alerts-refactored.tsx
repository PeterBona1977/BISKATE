"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Check, X, Eye, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { useModerationAlerts, type ModerationAlert } from "@/hooks/use-moderation-alerts"
import { AdminTable, type Column } from "./shared/admin-table"
import { AdminSearchFilter, type FilterOption } from "./shared/admin-search-filter"
import { AdminErrorBoundary } from "./shared/admin-error-boundary"

export function ModerationAlertsRefactored() {
  const {
    filteredAlerts,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    severityFilter,
    setSeverityFilter,
    updateAlertStatus,
    deleteAlert,
  } = useModerationAlerts()

  const [resolvingAlert, setResolvingAlert] = useState<ModerationAlert | null>(null)
  const [resolution, setResolution] = useState("")

  // Filtros para o componente de pesquisa
  const filters: FilterOption[] = [
    {
      label: "Status",
      value: "status",
      options: [
        { label: "Pendente", value: "pending" },
        { label: "Em Revisão", value: "reviewing" },
        { label: "Resolvido", value: "resolved" },
        { label: "Rejeitado", value: "dismissed" },
      ],
    },
    {
      label: "Severidade",
      value: "severity",
      options: [
        { label: "Baixa", value: "low" },
        { label: "Média", value: "medium" },
        { label: "Alta", value: "high" },
        { label: "Crítica", value: "critical" },
      ],
    },
  ]

  const handleFilterChange = (filter: string, value: string) => {
    if (filter === "status") {
      setStatusFilter(value === "all" ? "all" : value)
    } else if (filter === "severity") {
      setSeverityFilter(value === "all" ? "all" : value)
    }
  }

  const handleResolveAlert = async () => {
    if (!resolvingAlert) return

    const success = await updateAlertStatus(resolvingAlert.id, "resolved", resolution)
    if (success) {
      setResolvingAlert(null)
      setResolution("")
    }
  }

  const handleQuickAction = async (alertId: string, action: string) => {
    await updateAlertStatus(alertId, action)
  }

  // Ícones para status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "reviewing":
        return <Eye className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      case "dismissed":
        return <X className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  // Cores para badges
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "reviewing":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "dismissed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-red-100 text-red-800"
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Definição das colunas da tabela
  const columns: Column<ModerationAlert>[] = [
    {
      header: "Alerta",
      accessorKey: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.reason}</div>
          <div className="text-sm text-gray-500 line-clamp-2">{row.description}</div>
          <div className="text-xs text-gray-400">
            {row.profiles?.full_name || "Utilizador desconhecido"} • {row.gigs?.title || "Gig desconhecido"}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.status || "pending")}
          <Badge className={getStatusBadgeColor(row.status || "pending")}>{row.status || "pending"}</Badge>
        </div>
      ),
    },
    {
      header: "Severidade",
      accessorKey: "severity",
      cell: (row) => <Badge className={getSeverityBadgeColor(row.severity || "low")}>{row.severity || "low"}</Badge>,
    },
    {
      header: "Data",
      accessorKey: "created_at",
      cell: (row) => <span className="text-sm">{new Date(row.created_at).toLocaleDateString("pt-PT")}</span>,
    },
    {
      header: "Ações",
      accessorKey: (row) => (
        <div className="flex items-center space-x-2">
          {row.status === "pending" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600"
                onClick={() => handleQuickAction(row.id, "reviewing")}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="text-green-600" onClick={() => setResolvingAlert(row)}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600"
                onClick={() => handleQuickAction(row.id, "dismissed")}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {row.status === "reviewing" && (
            <Button variant="outline" size="sm" className="text-green-600" onClick={() => setResolvingAlert(row)}>
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      className: "w-32",
    },
  ]

  return (
    <AdminErrorBoundary>
      <div className="space-y-6">
        {/* Filtros de Pesquisa */}
        <AdminSearchFilter
          placeholder="Pesquisar por motivo, descrição, utilizador ou gig..."
          filters={filters}
          onSearch={setSearchTerm}
          onFilterChange={handleFilterChange}
        />

        {/* Tabela de Alertas */}
        <AdminTable
          data={filteredAlerts}
          columns={columns}
          title="Alertas de Moderação"
          totalItems={filteredAlerts.length}
          itemsPerPage={10}
          isLoading={loading}
          emptyMessage="Nenhum alerta de moderação encontrado"
        />

        {/* Dialog de Resolução */}
        <Dialog
          open={!!resolvingAlert}
          onOpenChange={(open) => {
            if (!open) {
              setResolvingAlert(null)
              setResolution("")
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolver Alerta de Moderação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Motivo:</strong> {resolvingAlert?.reason}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Descrição:</strong> {resolvingAlert?.description}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Resolução:</label>
                <Textarea
                  placeholder="Descreva como o alerta foi resolvido..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setResolvingAlert(null)
                  setResolution("")
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleResolveAlert} disabled={!resolution.trim()}>
                Resolver
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminErrorBoundary>
  )
}
