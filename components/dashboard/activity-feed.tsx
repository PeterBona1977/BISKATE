import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Briefcase, Star, Euro, Clock, CheckCircle } from "lucide-react"

interface ActivityItem {
  id: string
  type: "message" | "gig" | "review" | "payment" | "proposal"
  title: string
  description: string
  time: string
  status?: "pending" | "completed" | "active"
  avatar?: string
  amount?: string
}

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "message",
    title: "Nova mensagem de João Silva",
    description: "Interessado no seu serviço de design gráfico",
    time: "2 min atrás",
    status: "pending",
    avatar: "/placeholder.svg?height=32&width=32&text=JS",
  },
  {
    id: "2",
    type: "gig",
    title: 'Projeto "Website E-commerce" concluído',
    description: "Cliente aprovou a entrega final",
    time: "1 hora atrás",
    status: "completed",
    amount: "€850",
  },
  {
    id: "3",
    type: "review",
    title: "Nova avaliação recebida",
    description: "Maria Costa avaliou seu trabalho com 5 estrelas",
    time: "3 horas atrás",
    status: "completed",
    avatar: "/placeholder.svg?height=32&width=32&text=MC",
  },
  {
    id: "4",
    type: "proposal",
    title: "Proposta enviada",
    description: "Desenvolvimento de aplicação móvel - €1,200",
    time: "5 horas atrás",
    status: "pending",
  },
  {
    id: "5",
    type: "payment",
    title: "Pagamento recebido",
    description: "Transferência bancária processada",
    time: "1 dia atrás",
    status: "completed",
    amount: "€450",
  },
  {
    id: "6",
    type: "gig",
    title: "Novo projeto iniciado",
    description: "Criação de identidade visual para startup",
    time: "2 dias atrás",
    status: "active",
    amount: "€600",
  },
]

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "message":
      return MessageSquare
    case "gig":
      return Briefcase
    case "review":
      return Star
    case "payment":
      return Euro
    case "proposal":
      return Clock
    default:
      return CheckCircle
  }
}

function getStatusColor(status?: ActivityItem["status"]) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "completed":
      return "bg-green-100 text-green-800"
    case "active":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type)

            return (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {activity.avatar ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {activity.title
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                    <div className="flex items-center space-x-2">
                      {activity.amount && (
                        <span className="text-sm font-semibold text-green-600">{activity.amount}</span>
                      )}
                      {activity.status && (
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(activity.status)}`}>
                          {activity.status === "pending" && "Pendente"}
                          {activity.status === "completed" && "Concluído"}
                          {activity.status === "active" && "Ativo"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
