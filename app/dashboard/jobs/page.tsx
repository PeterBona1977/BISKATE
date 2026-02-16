"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Euro, Clock, Star, Filter } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

interface Job {
  id: string
  title: string
  description: string
  location: string
  price: number
  category: string
  author: string
  rating: number
  responses: number
  timeAgo: string
  isPremium: boolean
  created_at?: string
}

export default function JobsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, searchTerm, selectedCategory, selectedLocation])

  const loadJobs = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("gigs")
        .select(`
          *,
          author:profiles(full_name, avatar_url, rating)
        `)
        .eq('status', 'open') // Assuming 'open' is the status for available jobs
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedJobs: Job[] = data.map((gig: any) => ({
        id: gig.id,
        title: gig.title,
        description: gig.description,
        location: gig.location || "Remoto",
        price: gig.price || 0,
        category: gig.category,
        author: gig.author?.full_name || "Utilizador",
        rating: gig.author?.rating || 5.0,
        responses: 0, // Pending implementation of separate count
        timeAgo: formatTimeAgo(gig.created_at),
        isPremium: false,
        created_at: gig.created_at
      }))

      setJobs(formattedJobs)
      setFilteredJobs(formattedJobs)
    } catch (error) {
      console.error("Erro ao carregar trabalhos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Realtime subscription for new Gigs
    const channel = supabase
      .channel('public:gigs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gigs', filter: 'status=eq.open' }, (payload) => {
        loadJobs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5

    if (diffInHours < 1) return "Recentemente"
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h`
    return `${Math.floor(diffInHours / 24)}d`
  }

  const filterJobs = () => {
    let filtered = jobs

    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((job) => job.category === selectedCategory)
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter((job) => job.location === selectedLocation)
    }

    setFilteredJobs(filtered)
  }

  const categories = ["Design", "Desenvolvimento", "Marketing", "Tradução", "Fotografia", "Consultoria"]
  const locations = ["Lisboa", "Porto", "Braga", "Coimbra", "Aveiro", "Faro"]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando trabalhos disponíveis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Procurar Trabalhos</h1>
        <p className="text-gray-600 mt-2">Encontre oportunidades que combinam com suas habilidades</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar trabalhos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Localização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as localizações</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredJobs.length} {filteredJobs.length === 1 ? "trabalho encontrado" : "trabalhos encontrados"}
        </p>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum trabalho encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou pesquisar por outros termos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      {job.isPremium && (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">Premium</Badge>
                      )}
                      <Badge variant="outline">{job.category}</Badge>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Euro className="h-4 w-4 mr-1" />€{job.price}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.timeAgo}
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                        {job.rating}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Por <span className="font-medium">{job.author}</span> • {job.responses} propostas
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">€{job.price}</div>
                      <div className="text-sm text-gray-500">Orçamento</div>
                    </div>
                    <Link href={`/dashboard/gigs/${job.id}`}>
                      <Button className="w-full">Ver Detalhes</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
