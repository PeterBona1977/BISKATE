"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

const biskateSchema = z.object({
  title: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  description: z.string().min(20, "Descrição deve ter pelo menos 20 caracteres"),
  category: z.string().min(1, "Categoria é obrigatória"),
  budget_min: z.number().min(1, "Orçamento mínimo deve ser maior que 0"),
  budget_max: z.number().min(1, "Orçamento máximo deve ser maior que 0"),
  deadline: z.string().min(1, "Prazo é obrigatório"),
  location: z.string().optional(),
  requirements: z.string().optional(),
})

type BiskateFormData = z.infer<typeof biskateSchema>

const categories = [
  "Tecnologia",
  "Design",
  "Marketing",
  "Escrita",
  "Tradução",
  "Consultoria",
  "Educação",
  "Saúde",
  "Jurídico",
  "Outros",
]

export default function CreateBiskateForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BiskateFormData>({
    resolver: zodResolver(biskateSchema),
  })

  const budgetMin = watch("budget_min")
  const budgetMax = watch("budget_max")

  const onSubmit = async (data: BiskateFormData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um biskate",
        variant: "destructive",
      })
      return
    }

    if (data.budget_max < data.budget_min) {
      toast({
        title: "Erro",
        description: "O orçamento máximo deve ser maior que o mínimo",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { data: biskate, error } = await supabase
        .from("biskates")
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
          budget_min: data.budget_min,
          budget_max: data.budget_max,
          deadline: data.deadline,
          location: data.location,
          requirements: data.requirements,
          client_id: user.id,
          status: "open",
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Sucesso!",
        description: "Biskate criado com sucesso",
      })

      router.push(`/dashboard/biskates/${biskate.id}`)
    } catch (error) {
      console.error("Erro ao criar biskate:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar biskate. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Criar Nova Gig</CardTitle>
          <CardDescription>Descreva o trabalho que precisa e encontre o profissional ideal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Gig</Label>
              <Input id="title" placeholder="Ex: Preciso de um logo para minha empresa" {...register("title")} />
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição Detalhada</Label>
              <Textarea
                id="description"
                placeholder="Descreva em detalhes o que precisa..."
                rows={4}
                {...register("description")}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select onValueChange={(value) => setValue("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_min">Orçamento Mínimo (€)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="50"
                  {...register("budget_min", { valueAsNumber: true })}
                />
                {errors.budget_min && <p className="text-sm text-red-600">{errors.budget_min.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_max">Orçamento Máximo (€)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="200"
                  {...register("budget_max", { valueAsNumber: true })}
                />
                {errors.budget_max && <p className="text-sm text-red-600">{errors.budget_max.message}</p>}
              </div>
            </div>

            {budgetMin && budgetMax && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Orçamento: €{budgetMin} - €{budgetMax}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input id="deadline" type="date" min={new Date().toISOString().split("T")[0]} {...register("deadline")} />
              {errors.deadline && <p className="text-sm text-red-600">{errors.deadline.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização (Opcional)</Label>
              <Input id="location" placeholder="Ex: Lisboa, Portugal" {...register("location")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requisitos Especiais (Opcional)</Label>
              <Textarea
                id="requirements"
                placeholder="Requisitos específicos, experiência necessária, etc."
                rows={3}
                {...register("requirements")}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              style={{ backgroundColor: "rgb(79, 70, 229)" }}
            >
              {isLoading ? "Criando..." : "Criar Gig"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
