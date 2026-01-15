import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, MessageSquare, Settings, FileText, Users } from "lucide-react"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  variant?: "default" | "outline" | "secondary"
}

const quickActions: QuickAction[] = [
  {
    id: "1",
    title: "Criar Gig",
    description: "Publique um novo serviço",
    icon: Plus,
    href: "/dashboard/gigs/create",
    variant: "default",
  },
  {
    id: "2",
    title: "Procurar Trabalhos",
    description: "Encontre oportunidades",
    icon: Search,
    href: "/dashboard/jobs",
    variant: "outline",
  },
  {
    id: "3",
    title: "Mensagens",
    description: "Gerir conversas",
    icon: MessageSquare,
    href: "/dashboard/messages",
    variant: "outline",
  },
  {
    id: "4",
    title: "Relatórios",
    description: "Ver estatísticas",
    icon: FileText,
    href: "/dashboard/analytics",
    variant: "outline",
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <Button
                key={action.id}
                variant={action.variant || "outline"}
                className="h-auto p-4 justify-start"
                asChild
              >
                <a href={action.href} className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </a>
              </Button>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <a href="/dashboard/settings" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ver todas as opções
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
