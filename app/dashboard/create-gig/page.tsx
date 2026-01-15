"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { CreateGigForm } from "@/components/gigs/create-gig-form"
import { AIConversation } from "@/components/voice/ai-conversation"
import { GigReviewModal } from "@/components/gigs/gig-review-modal"
import { Button } from "@/components/ui/button"
import { Bot, FileText } from "lucide-react"

import { useTranslations } from "next-intl"

interface GigData {
  title: string
  description: string
  category: string
  price: number
  location: string
  estimatedTime: string
}

const CreateGigPage = () => {
  const t = useTranslations("Dashboard.CreateGig")
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("manual")
  const [gigDataFromAI, setGigDataFromAI] = useState<GigData | null>(null)

  // Função chamada quando a IA completa a conversa
  const handleAIComplete = (data: any) => {
    console.log("🤖 IA completou conversa com dados:", data)

    // Validar se temos todos os dados necessários
    if (!data.title || !data.description || !data.category || !data.price || !data.location || !data.estimatedTime) {
      console.error("❌ Dados incompletos da IA:", data)
      return
    }

    // Converter para o formato esperado
    const gigData: GigData = {
      title: data.title,
      description: data.description,
      category: data.category,
      price: Number(data.price),
      location: data.location,
      estimatedTime: data.estimatedTime,
    }

    console.log("✅ Dados formatados para revisão:", gigData)

    // Fechar modal da IA
    setIsAIModalOpen(false)

    // Guardar dados e abrir modal de revisão
    setGigDataFromAI(gigData)
    setIsReviewModalOpen(true)
  }

  // Função para editar o gig (volta ao formulário manual)
  const handleEditGig = (data: GigData) => {
    console.log("✏️ Editando gig:", data)
    setIsReviewModalOpen(false)
    setActiveTab("manual")
    // Aqui poderíamos pré-preencher o formulário manual com os dados da IA
    // Por agora, o utilizador terá que preencher manualmente
  }

  // Função chamada quando o gig é criado com sucesso
  const handleGigCreated = () => {
    console.log("✅ Gig criado com sucesso!")
    setGigDataFromAI(null)
    setIsReviewModalOpen(false)
  }

  return (
    <div className="container relative py-10">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>

      <Separator className="my-6" />

      <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>{t("tabs.manual")}</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span>{t("tabs.ai")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <div className="max-w-2xl">
            <CreateGigForm />
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 max-w-2xl">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{t("ai.title")}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("ai.description")}
                </p>
              </div>

              <div className="flex flex-col space-y-2">
                <Button onClick={() => setIsAIModalOpen(true)} className="w-full md:w-auto flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span>{t("ai.startBtn")}</span>
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t("ai.helpText")}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Conversa com IA */}
      <AIConversation isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} onComplete={handleAIComplete} />

      {/* Modal de Revisão do Gig */}
      {gigDataFromAI && (
        <GigReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          gigData={gigDataFromAI}
          onEdit={handleEditGig}
          onSuccess={handleGigCreated}
        />
      )}
    </div>
  )
}

export default CreateGigPage
