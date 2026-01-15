import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, Bell, FileText, AlertTriangle, Activity } from "lucide-react"

export function SystemOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Utilizadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">5</div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">+2 novos esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Biskates Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">12</div>
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">+3 novos esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">24</div>
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">+8 novas esta semana</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`w-2 h-2 mt-2 rounded-full ${getActivityColor(activity.type)}`} />
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`w-2 h-2 mt-2 rounded-full ${getAlertColor(alert.severity)}`} />
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                  <Badge variant={getAlertVariant(alert.severity)} className="ml-auto">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório de Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Uptime</h3>
              <p className="text-2xl font-bold mt-1">99.9%</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Tempo de Resposta</h3>
              <p className="text-2xl font-bold mt-1">120ms</p>
              <p className="text-xs text-gray-500 mt-1">Média</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Erros</h3>
              <p className="text-2xl font-bold mt-1">0.01%</p>
              <p className="text-xs text-gray-500 mt-1">Taxa de erro</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Utilizadores Ativos</h3>
              <p className="text-2xl font-bold mt-1">3</p>
              <p className="text-xs text-gray-500 mt-1">Agora</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Funções auxiliares
function getActivityColor(type: string) {
  switch (type) {
    case "login":
      return "bg-blue-500"
    case "create":
      return "bg-green-500"
    case "update":
      return "bg-yellow-500"
    case "delete":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

function getAlertColor(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-500"
    case "warning":
      return "bg-yellow-500"
    case "info":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

function getAlertVariant(severity: string) {
  switch (severity) {
    case "critical":
      return "destructive"
    case "warning":
      return "warning"
    case "info":
      return "secondary"
    default:
      return "outline"
  }
}

// Dados de exemplo
const recentActivity = [
  {
    type: "login",
    description: "Administrador fez login",
    time: "Há 5 minutos",
  },
  {
    type: "create",
    description: "Novo biskate criado por João Silva",
    time: "Há 2 horas",
  },
  {
    type: "update",
    description: "Perfil atualizado por Maria Oliveira",
    time: "Há 3 horas",
  },
  {
    type: "delete",
    description: "Biskate removido por moderador",
    time: "Há 1 dia",
  },
]

const systemAlerts = [
  {
    severity: "info",
    message: "Backup automático concluído com sucesso",
    time: "Hoje, 03:00",
  },
  {
    severity: "warning",
    message: "Uso de CPU acima de 80% por 5 minutos",
    time: "Hoje, 14:23",
  },
  {
    severity: "info",
    message: "Atualização de sistema disponível",
    time: "Ontem, 18:45",
  },
  {
    severity: "critical",
    message: "Falha na sincronização de dados",
    time: "Há 2 dias",
  },
]
