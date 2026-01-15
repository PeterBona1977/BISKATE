"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { ProviderCard, type ProviderCardData } from "@/components/providers/provider-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Sparkles, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProvidersDirectoryPage() {
    const [providers, setProviders] = useState<ProviderCardData[]>([])
    const [filteredProviders, setFilteredProviders] = useState<ProviderCardData[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [loading, setLoading] = useState(true)

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [sortBy, setSortBy] = useState<"premium" | "rating" | "recent">("premium")

    useEffect(() => {
        loadCategories()
        loadProviders()
    }, [])

    useEffect(() => {
        filterAndSortProviders()
    }, [providers, searchQuery, selectedCategory, sortBy])

    async function loadCategories() {
        const { data } = await supabase
            .from("categories")
            .select("id, name")
            .eq("is_active", true)
            .order("name")

        if (data) {
            setCategories(data)
        }
    }

    async function loadProviders() {
        setLoading(true)

        // Get all providers (users who have completed gigs or set as providers)
        const { data, error } = await supabase
            .from("profiles")
            .select(`
        id,
        full_name,
        avatar_url,
        bio,
        location,
        skills,
        rating,
        total_reviews,
        plan,
        provider_verified_at,
        hourly_rate,
        availability
      `)
            .eq("role", "provider")
            .order("created_at", { ascending: false })

        if (!error && data) {
            setProviders(data as ProviderCardData[])
        }

        setLoading(false)
    }

    function filterAndSortProviders() {
        let filtered = [...providers]

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (p) =>
                    p.full_name?.toLowerCase().includes(query) ||
                    p.bio?.toLowerCase().includes(query) ||
                    p.skills?.some((s) => s.toLowerCase().includes(query)) ||
                    p.location?.toLowerCase().includes(query)
            )
        }

        // Category filter (would need to join with provider_categories table)
        // For now, filtering by skills as proxy
        if (selectedCategory !== "all") {
            const category = categories.find((c) => c.id === selectedCategory)
            if (category) {
                filtered = filtered.filter((p) =>
                    p.skills?.some((s) => s.toLowerCase().includes(category.name.toLowerCase()))
                )
            }
        }

        // Sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "premium":
                    // Premium users first (unlimited > pro > essential > free)
                    const planOrder = { unlimited: 4, pro: 3, essential: 2, free: 1 }
                    const aPlan = planOrder[a.plan] || 0
                    const bPlan = planOrder[b.plan] || 0
                    if (aPlan !== bPlan) return bPlan - aPlan
                    // Then by rating
                    return (b.rating || 0) - (a.rating || 0)

                case "rating":
                    return (b.rating || 0) - (a.rating || 0)

                case "recent":
                default:
                    return 0 // Maintain original order (most recent first from query)
            }
        })

        setFilteredProviders(filtered)
    }

    const premiumCount = filteredProviders.filter((p) => p.plan === "pro" || p.plan === "unlimited").length

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Diretório de Prestadores</h1>
                <p className="text-gray-600">
                    Encontre os melhores profissionais para o seu projeto
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Pesquisar por nome, skills, localização..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Category Filter */}
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as categorias</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="premium">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                    Premium Primeiro
                                </div>
                            </SelectItem>
                            <SelectItem value="rating">Melhor Avaliação</SelectItem>
                            <SelectItem value="recent">Mais Recentes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Results count */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                        {filteredProviders.length} prestador{filteredProviders.length !== 1 ? "es" : ""} encontrado
                        {filteredProviders.length !== 1 ? "s" : ""}
                    </span>
                    {premiumCount > 0 && (
                        <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                {premiumCount} Premium
                            </Badge>
                        </>
                    )}
                </div>
            </div>

            {/* Provider Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="h-[300px]">
                            <CardContent className="p-6">
                                <Skeleton className="h-full w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredProviders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Nenhum prestador encontrado.</p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearchQuery("")
                            setSelectedCategory("all")
                        }}
                        className="mt-4"
                    >
                        Limpar filtros
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProviders.map((provider) => (
                        <ProviderCard key={provider.id} provider={provider} showPremiumHighlight={true} />
                    ))}
                </div>
            )}
        </div>
    )
}
