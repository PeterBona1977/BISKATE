"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp, MapPin, Star, MessageCircle, Heart } from "lucide-react"

export default function CommunityPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const communityStats = {
    totalUsers: 1247,
    activeGigs: 89,
    categories: 12,
    newThisWeek: 23,
  }

  const featuredUsers = [
    {
      id: 1,
      name: "Ana Silva",
      specialty: "Design Gráfico",
      location: "Lisboa",
      rating: 4.9,
      avatar: "/placeholder.svg?height=40&width=40",
      gigsCount: 15,
      followers: 234,
    },
    {
      id: 2,
      name: "João Santos",
      specialty: "Desenvolvimento Web",
      location: "Porto",
      rating: 4.8,
      avatar: "/placeholder.svg?height=40&width=40",
      gigsCount: 22,
      followers: 189,
    },
    {
      id: 3,
      name: "Maria Costa",
      specialty: "Marketing Digital",
      location: "Braga",
      rating: 4.9,
      avatar: "/placeholder.svg?height=40&width=40",
      gigsCount: 18,
      followers: 156,
    },
  ]

  const popularGigs = [
    {
      id: 1,
      title: "Criação de Logo Profissional",
      author: "Ana Silva",
      category: "Design",
      price: "€50-100",
      responses: 12,
      likes: 28,
    },
    {
      id: 2,
      title: "Website Responsivo",
      author: "João Santos",
      category: "Desenvolvimento",
      price: "€200-500",
      responses: 8,
      likes: 35,
    },
    {
      id: 3,
      title: "Estratégia de Redes Sociais",
      author: "Maria Costa",
      category: "Marketing",
      price: "€100-200",
      responses: 15,
      likes: 22,
    },
  ]

  const recentActivity = [
    {
      id: 1,
      user: "Pedro Oliveira",
      action: "publicou um novo Gig",
      gig: "Consultoria em SEO",
      time: "há 2 horas",
    },
    {
      id: 2,
      user: "Sofia Rodrigues",
      action: "respondeu ao Gig",
      gig: "Tradução de Documentos",
      time: "há 4 horas",
    },
    {
      id: 3,
      user: "Miguel Ferreira",
      action: "atualizou o perfil",
      gig: "",
      time: "há 6 horas",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comunidade</h1>
        <p className="text-muted-foreground">Descubra profissionais talentosos e Gigs populares</p>
      </div>

      {/* Estatísticas da Comunidade */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilizadores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+{communityStats.newThisWeek} esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gigs Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityStats.activeGigs}</div>
            <p className="text-xs text-muted-foreground">Disponíveis agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityStats.categories}</div>
            <p className="text-xs text-muted-foreground">Áreas de especialidade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityStats.newThisWeek}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="featured" className="space-y-4">
        <TabsList>
          <TabsTrigger value="featured">Utilizadores em Destaque</TabsTrigger>
          <TabsTrigger value="gigs">Gigs Populares</TabsTrigger>
          <TabsTrigger value="activity">Atividade Recente</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription>{user.specialty}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {user.location}
                    </div>
                    <div className="flex items-center text-sm">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      {user.rating} • {user.gigsCount} Gigs • {user.followers} seguidores
                    </div>
                    <Button className="w-full" variant="outline">
                      Ver Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gigs" className="space-y-4">
          <div className="grid gap-4">
            {popularGigs.map((gig) => (
              <Card key={gig.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{gig.title}</CardTitle>
                      <CardDescription>por {gig.author}</CardDescription>
                    </div>
                    <Badge variant="secondary">{gig.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-green-600">{gig.price}</div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {gig.responses} respostas
                      </div>
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {gig.likes} likes
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Ver Gig
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>O que está a acontecer na comunidade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {activity.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                        {activity.gig && <span className="font-medium"> "{activity.gig}"</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
