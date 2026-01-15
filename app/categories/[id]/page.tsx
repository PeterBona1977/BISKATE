
import { notFound } from "next/navigation"
import { ArrowLeft, Book, Home, Heart, Briefcase, Calendar, MoreHorizontal, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import categoriesData from "@/category_hierarchy.json"

// Type definition for Category based on the JSON structure
type Category = {
    id: string
    name: string
    parent_id: string | null
    children: Category[]
}

const getCategoryIcon = (name: string) => {
    switch (name.toUpperCase()) {
        case "AULAS": return <Book className="h-12 w-12" />
        case "CASA": return <Home className="h-12 w-12" />
        case "BEM-ESTAR": return <Heart className="h-12 w-12" />
        case "EMPRESAS": return <Briefcase className="h-12 w-12" />
        case "EVENTOS": return <Calendar className="h-12 w-12" />
        case "OUTROS": return <MoreHorizontal className="h-12 w-12" />
        default: return <Zap className="h-12 w-12" />
    }
}

export default function CategoryPage({ params }: { params: { id: string } }) {
    const category = (categoriesData as Category[]).find((c) => c.id === params.id)

    if (!category) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-indigo-600 text-white py-12">
                <div className="container mx-auto px-4">
                    <Link href="/" className="inline-flex items-center text-indigo-100 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para a página inicial
                    </Link>
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                            {getCategoryIcon(category.name)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
                            <p className="text-xl text-indigo-100">
                                Encontre os melhores profissionais em {category.name}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-900">Subcategorias</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {category.children && category.children.length > 0 ? (
                            category.children.map((sub: Category) => (
                                <Card key={sub.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="text-lg">{sub.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {sub.children && sub.children.length > 0 ? (
                                                sub.children.map((specialty) => (
                                                    <Badge key={specialty.id} variant="secondary" className="hover:bg-indigo-100 transition-colors">
                                                        {specialty.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500">Várias opções disponíveis</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <p className="text-gray-500 col-span-full">Nenhuma subcategoria encontrada.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
