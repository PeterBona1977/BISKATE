"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { MapPin, Euro, Clock, Search, Filter, Calendar, User, MessageSquare, Loader2 } from "lucide-react"

interface Gig {
  id: string
  title: string
  description: string
  category: string
  price: number | null
  location: string | null
  estimated_duration: number | null
  duration_unit: string
  status: string
  created_at: string
  user_id: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  }
}

const cities = [
  "Todas",
  "Lisboa",
  "Porto",
  "Coimbra",
  "Braga",
  "Aveiro",
  "Faro",
  "Setúbal",
  "Viseu",
  "Leiria",
  "Évora",
  "Santarém",
  "Bragança",
  "Castelo Branco",
  "Guarda",
  "Portalegre",
  "Viana do Castelo",
  "Vila Real",
  "Beja",
]

export default function GigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [selectedLocation, setSelectedLocation] = useState("Todas")
  const [userCategories, setUserCategories] = useState<string[]>([])

  const { user } = useAuth()
  const { toast } = useToast()
  // const supabase = createClient() - Using imported singleton instead

  useEffect(() => {
    fetchGigs()
  }, [])

  useEffect(() => {
    filterGigs()
  }, [gigs, searchTerm, selectedCategory, selectedLocation])

  const fetchGigs = async () => {
    try {
      if (!user) return

      // First fetch provider's skills (which are category IDs)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", user.id)
        .single()

      const providerSkills = profileData?.skills || []

      // If provider has no skills, they see nothing or we could show all. 
      // User request implies strict filtering: "only see gig oportunities that area related to is preferences"
      if (providerSkills.length === 0) {
        setGigs([])
        return
      }

      // We need to resolve these IDs to category names because gigs table uses names (based on current observation)
      // OR gigs table uses IDs. The current page.tsx uses hardcoded string categories in a dropdown, 
      // suggesting gigs might store strings. Let's assume strings for now to match the existing UI.
      // BUT `ServiceSelector` uses UUIDs from `categories` table.
      // 
      // CRITICAL CHECK: Does `categories` table name match `gigs.category` string?
      // We will try to fetch category names for the skill IDs.

      const { data: categoriesData } = await supabase
        .from("categories")
        .select("name")
        .in("id", providerSkills)

      const skillNames = categoriesData?.map(c => c.name) || []
      setUserCategories(skillNames)

      // Now fetch gigs that match these category names
      // Note: This matches exact name. If there's a mismatch in casing/spelling, this might fail.
      // Ideally gigs should store category_id. 
      // Assuming `category` column in `gigs` stores the Name.

      if (skillNames.length === 0) {
        setGigs([])
        return
      }

      const { data, error } = await supabase
        .from("gigs")
        .select(`
          *,
          profiles:profiles!user_id (
            full_name,
            avatar_url
          )
        `)
        .eq("status", "active")
        .in("category", skillNames) // Filter by category names
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setGigs(data || [])
    } catch (error) {
      console.error("Erro ao carregar gigs:", error)
      toast({
        title: "Erro ao carregar gigs",
        description: "Não foi possível carregar as gigs disponíveis.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterGigs = () => {
    let filtered = gigs

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (gig) =>
          gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gig.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory !== "Todos") {
      filtered = filtered.filter((gig) => gig.category === selectedCategory)
    }

    // Filter by location
    if (selectedLocation !== "Todas") {
      filtered = filtered.filter((gig) => gig.location === selectedLocation)
    }

    setFilteredGigs(filtered)
  }

  const formatDuration = (duration: number | null, unit: string) => {
    if (!duration) return "Não especificado"

    const unitText = unit === "hours" ? "horas" : unit === "days" ? "dias" : "semanas"
    return `${duration} ${unitText}`
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Limpeza: "bg-blue-100 text-blue-800",
      Canalizador: "bg-cyan-100 text-cyan-800",
      Eletricista: "bg-yellow-100 text-yellow-800",
      Pintura: "bg-purple-100 text-purple-800",
      Jardinagem: "bg-green-100 text-green-800",
      Educação: "bg-indigo-100 text-indigo-800",
      Tecnologia: "bg-gray-100 text-gray-800",
      Transporte: "bg-orange-100 text-orange-800",
      Cozinha: "bg-red-100 text-red-800",
      Outros: "bg-slate-100 text-slate-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gigs Disponíveis</h1>
        <p className="text-gray-600">Encontre serviços disponíveis na sua área</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search gigs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {userCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Localização</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {filteredGigs.length} gig{filteredGigs.length !== 1 ? "s" : ""} found
          {filteredGigs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {filteredGigs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhuma gig encontrada</h3>
              <p className="text-gray-600 mb-4">Tente ajustar os filtros ou pesquisar por outros termos</p>
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("Todos")
                  setSelectedLocation("Todas")
                }}
                variant="outline"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredGigs.map((gig) => (
            <Card key={gig.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{gig.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {gig.description.length > 200 ? `${gig.description.substring(0, 200)}...` : gig.description}
                    </CardDescription>
                  </div>
                  <Badge className={getCategoryColor(gig.category)}>{gig.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {gig.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {gig.location}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {formatDuration(gig.estimated_duration, gig.duration_unit)}
                  </div>

                  {gig.price && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Euro className="h-4 w-4" />
                      {gig.price}€
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    {gig.profiles?.full_name || "Utilizador"}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(gig.created_at).toLocaleDateString("pt-PT")}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                    {user && user.id !== gig.user_id && (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Responder
                      </Button>
                    )}
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
