"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, TrendingUp, Target, Send, CheckCircle, AlertTriangle, BarChart3, RefreshCw } from "lucide-react"
import { ProfileCompletionService } from "@/lib/profile/profile-completion-service"
import { useToast } from "@/hooks/use-toast"

interface CompletionStats {
  total_users: number
  completed_profiles: number
  incomplete_profiles: number
  average_completion: number
  by_score_range: {
    "0-25": number
    "25-50": number
    "50-75": number
    "75-100": number
  }
}

export function ProfileCompletionAnalytics() {
  const { toast } = useToast()
  const [stats, setStats] = useState<CompletionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await ProfileCompletionService.getCompletionStats()

      if (data) {
        setStats(data)
      } else {
        setError("Erro ao carregar estatísticas")
      }
    } catch (err) {
      console.error("Error loading completion stats:", err)
      setError("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminders = async () => {
    try {
      setSendingReminders(true)

      const reminderCount = await ProfileCompletionService.sendBatchReminders()

      toast({
        title: "Lembretes Enviados",
        description: `${reminderCount} lembretes de completude de perfil foram enviados com sucesso.`,
      })

      // Recarregar estatísticas
      await loadStats()
    } catch (error) {
      console.error("Error sending reminders:", error)
      toast({
        title: "Erro",
        description: "Erro ao enviar lembretes. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSendingReminders(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || "Não foi possível carregar as estatísticas de completude"}</AlertDescription>
      </Alert>
    )
  }

  const completionRate = stats.total_users > 0 ? (stats.completed_profiles / stats.total_users) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Completude de Perfis</h2>
          <p className="text-muted-foreground">Monitorize e incentive a completude dos perfis dos utilizadores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={handleSendReminders} disabled={sendingReminders}>
            <Send className={`h-4 w-4 mr-2 ${sendingReminders ? "animate-pulse" : ""}`} />
            {sendingReminders ? "Enviando..." : "Enviar Lembretes"}
          </Button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Utilizadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Utilizadores registados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfis Completos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed_profiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{completionRate.toFixed(1)}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfis Incompletos</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.incomplete_profiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{(100 - completionRate).toFixed(1)}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completude Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.average_completion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Média de completude</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Faixas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribuição por Faixas de Completude
          </CardTitle>
          <CardDescription>Análise detalhada da completude dos perfis por faixas percentuais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Faixa 0-25% */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">0-25% (Crítico)</span>
                <Badge variant="destructive">{stats.by_score_range["0-25"]} utilizadores</Badge>
              </div>
              <Progress
                value={stats.total_users > 0 ? (stats.by_score_range["0-25"] / stats.total_users) * 100 : 0}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">Perfis com informações muito básicas</p>
            </div>

            {/* Faixa 25-50% */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">25-50% (Baixo)</span>
                <Badge variant="secondary">{stats.by_score_range["25-50"]} utilizadores</Badge>
              </div>
              <Progress
                value={stats.total_users > 0 ? (stats.by_score_range["25-50"] / stats.total_users) * 100 : 0}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">Perfis com informações parciais</p>
            </div>

            {/* Faixa 50-75% */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">50-75% (Médio)</span>
                <Badge variant="outline">{stats.by_score_range["50-75"]} utilizadores</Badge>
              </div>
              <Progress
                value={stats.total_users > 0 ? (stats.by_score_range["50-75"] / stats.total_users) * 100 : 0}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">Perfis quase completos</p>
            </div>

            {/* Faixa 75-100% */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">75-100% (Completo)</span>
                <Badge variant="default" className="bg-green-600">
                  {stats.by_score_range["75-100"]} utilizadores
                </Badge>
              </div>
              <Progress
                value={stats.total_users > 0 ? (stats.by_score_range["75-100"] / stats.total_users) * 100 : 0}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">Perfis completos e otimizados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações de Ação</CardTitle>
          <CardDescription>Sugestões para melhorar a taxa de completude dos perfis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>Foco Prioritário:</strong> {stats.by_score_range["0-25"]} utilizadores com perfis críticos
                (0-25%) precisam de atenção imediata.
              </AlertDescription>
            </Alert>

            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Oportunidade:</strong> {stats.by_score_range["50-75"]} utilizadores estão próximos da completude
                (50-75%).
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Ações Sugeridas:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Enviar lembretes personalizados baseados na faixa de completude</li>
              <li>• Criar incentivos para utilizadores que completarem o perfil</li>
              <li>• Implementar onboarding guiado para novos utilizadores</li>
              <li>• Destacar benefícios de perfis completos na plataforma</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfileCompletionAnalytics
