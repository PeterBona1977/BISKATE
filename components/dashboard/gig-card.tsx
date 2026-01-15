import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Euro, Eye, MessageSquare } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/supabase/database.types"

type Gig = Database["public"]["Tables"]["gigs"]["Row"]

interface GigCardProps {
  gig: Gig
  showActions?: boolean
  variant?: "default" | "compact"
}

export function GigCard({ gig, showActions = true, variant = "default" }: GigCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendente
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejeitado
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Em Progresso
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            Concluído
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (variant === "compact") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-sm line-clamp-1">{gig.title}</h3>
            {gig.is_premium && <Badge className="bg-orange-100 text-orange-800 text-xs">Premium</Badge>}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-green-600">€{Number(gig.price).toFixed(2)}</span>
            {getStatusBadge(gig.status)}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{gig.title}</CardTitle>
          <div className="flex items-center space-x-2">
            {gig.is_premium && <Badge className="bg-orange-100 text-orange-800 border-orange-200">Premium</Badge>}
            {getStatusBadge(gig.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">{gig.description}</p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Euro className="h-4 w-4 text-gray-400" />
              <span className="font-semibold text-lg text-green-600">€{Number(gig.price).toFixed(2)}</span>
            </div>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{gig.category}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{gig.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{gig.estimated_time}</span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex space-x-2">
            <Button className="flex-1" size="sm" asChild>
              <Link href={`/dashboard/gigs/${gig.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                Ver Detalhes
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/gigs/${gig.id}/chat`}>
                <MessageSquare className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
// Não há textos visíveis para alterar neste componente - apenas estrutura
