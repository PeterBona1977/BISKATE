"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Upload, Plus, Trash2, Loader2, Crosshair, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ServiceSelector } from "./service-selector"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { ReviewsDisplay } from "@/components/reviews/reviews-display"
import { Activity, CheckCircle } from "lucide-react"

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  image_url: string | null
  category_id: string | null
}

interface Document {
  id: string
  document_type: string
  document_name: string
  status: string
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "secondary" | "default" | "destructive"> = {
    pending: "secondary",
    approved: "default",
    rejected: "destructive",
    suspended: "destructive",
  }

  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    suspended: "Suspenso",
    inactive: "Inativo",
  }

  return (
    <Badge variant={variants[status] || "secondary"}>
      {labels[status] || status}
    </Badge>
  )
}

import { useTranslations } from "next-intl"

export function ProviderProfile() {
  const t = useTranslations("Dashboard.Profile.Provider")
  const { profile, refreshProfile, updateProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [documents, setDocuments] = useState<Document[]>([])

  // Portfolio dialog state
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false)
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null)
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    image_url: "",
    project_url: ""
  })

  // Document type state
  const [documentType, setDocumentType] = useState("other")

  // Form states
  const [bio, setBio] = useState(profile?.provider_bio || "")
  const [website, setWebsite] = useState(profile?.provider_website || "")
  const [phone, setPhone] = useState(profile?.provider_phone || "")
  const [location, setLocation] = useState(profile?.provider_location || "")
  const [experienceYears, setExperienceYears] = useState(profile?.provider_experience_years || 0)
  const [providerFullName, setProviderFullName] = useState(profile?.provider_full_name || "")
  const [vatNumber, setVatNumber] = useState(profile?.vat_number || "")
  const [hourlyRate, setHourlyRate] = useState(profile?.provider_hourly_rate || 0)
  const [availability, setAvailability] = useState(profile?.provider_availability || "available")
  const [completedJobs, setCompletedJobs] = useState(0)
  const [companyName, setCompanyName] = useState(profile?.company_name || "")
  const [serviceRadius, setServiceRadius] = useState(profile?.provider_service_radius || 20)
  const [lat, setLat] = useState<number | null>(profile?.last_lat || null)
  const [lng, setLng] = useState<number | null>(profile?.last_lng || null)
  const [postalCode, setPostalCode] = useState(profile?.postal_code || "")
  const [providerType, setProviderType] = useState(profile?.provider_type || "individual")

  useEffect(() => {
    if (profile) {
      setBio(profile.provider_bio || "")
      setWebsite(profile.provider_website || "")
      setPhone(profile.provider_phone || "")
      setLocation(profile.provider_location || "")
      setExperienceYears(profile.provider_experience_years || 0)
      setProviderFullName(profile.provider_full_name || "")
      setVatNumber(profile.vat_number || "")
      setHourlyRate(profile.provider_hourly_rate || 0)
      setAvailability(profile.provider_availability || "available")
      setProviderType(profile.provider_type || "individual")
      setCompanyName(profile.company_name || "")
      setServiceRadius(profile.provider_service_radius || 20)
      setLat(profile.last_lat || null)
      setLng(profile.last_lng || null)
      setPostalCode(profile.postal_code || profile.provider_location || "") // Fallback to location?
      fetchPortfolio()
      fetchDocuments()
      fetchCompletedJobsCount()
    }
  }, [profile])

  // Removed manual Google Maps loading as AddressAutocomplete handles it internally


  const fetchPortfolio = async () => {
    if (!profile) return

    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("provider_id", profile.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setPortfolio(data)
    }
  }

  const fetchDocuments = async () => {
    if (!profile) return

    const { data, error } = await supabase
      .from("provider_documents")
      .select("*")
      .eq("provider_id", profile.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setDocuments(data)
    }
  }

  const fetchCompletedJobsCount = async () => {
    if (!profile) return
    const { count, error } = await supabase
      .from("gig_responses")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", profile.id)
      .eq("status", "completed")

    if (!error && count !== null) {
      setCompletedJobs(count)
    }
  }



  const updateProfileData = async () => {
    if (!profile) return

    if (!vatNumber?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O NIF / VAT é obrigatório para todos os prestadores.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let finalLat = lat
      let finalLng = lng

      // Auto-geocode if location text exists but coords are missing/stale
      if (location && window.google && window.google.maps && window.google.maps.Geocoder) {
        // If the user typed a new location but didn't select from dropdown, lat/lng might be old or null
        // We'll trust the geocoder for the current text input
        try {
          const geocoder = new window.google.maps.Geocoder()
          const results: any = await new Promise((resolve, reject) => {
            geocoder.geocode({ address: location }, (results, status) => {
              if (status === "OK" && results && results[0]) resolve(results)
              else reject(status)
            })
          })

          if (results && results[0] && results[0].geometry) {
            finalLat = results[0].geometry.location.lat()
            finalLng = results[0].geometry.location.lng()
            setLat(finalLat)
            setLng(finalLng)
          }
        } catch (geoErr) {
          console.error("Auto-geocoding failed:", geoErr)
          // Don't block save, just warn console
        }
      }

      const { error } = await updateProfile({
        provider_bio: bio,
        provider_website: website,
        provider_phone: phone,
        provider_location: location,
        provider_experience_years: experienceYears,
        provider_full_name: providerFullName,
        vat_number: vatNumber,
        provider_hourly_rate: hourlyRate,
        provider_availability: availability,
        provider_type: providerType,
        company_name: companyName,
        provider_service_radius: serviceRadius,
        last_lat: finalLat,
        last_lng: finalLng,
        hourly_rate: hourlyRate,
        postal_code: location, // Use the location string as postal code since they are one and the same in this flow
        updated_at: new Date().toISOString(),
      })

      if (error) throw new Error(error)

      toast({
        title: t("toasts.updated"),
        description: t("toasts.updatedDesc"),
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingDoc(true)
    try {
      const path = `providers/${profile.id}/doc_${Date.now()}_${file.name}`
      const { data, error: uploadError } = await supabase.storage.from("documents").upload(path, file)

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from("provider_documents").insert({
        provider_id: profile.id,
        document_type: documentType,
        document_name: file.name,
        document_url: data.path,
        status: "pending",
      })

      if (insertError) throw insertError

      toast({
        title: t("documents.status.pending"), // Using a generic success message or specific "Document uploaded"
        description: "O documento foi enviado para validação.", // Ideally this should also be translated, e.g. t("toasts.docUploaded")
      })
      fetchDocuments()
    } catch (error: any) {
      toast({
        title: "Erro ao enviar documento",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploadingDoc(false)
    }
    // Reset document type after upload
    e.target.value = ""
  }

  const handleAddPortfolio = () => {
    setEditingPortfolioId(null)
    setPortfolioForm({
      title: "",
      description: "",
      image_url: "",
      project_url: ""
    })
    setPortfolioDialogOpen(true)
  }

  const handleEditPortfolio = (item: PortfolioItem) => {
    setEditingPortfolioId(item.id)
    setPortfolioForm({
      title: item.title,
      description: item.description || "",
      image_url: item.image_url || "",
      project_url: ""
    })
    setPortfolioDialogOpen(true)
  }

  const handleSavePortfolio = async () => {
    if (!profile || !portfolioForm.title) return

    setLoading(true)
    try {
      if (editingPortfolioId) {
        // Update existing
        const { error } = await supabase
          .from("portfolio_items")
          .update({
            title: portfolioForm.title,
            description: portfolioForm.description,
            image_url: portfolioForm.image_url,
          })
          .eq("id", editingPortfolioId)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from("portfolio_items")
          .insert({
            provider_id: profile.id,
            title: portfolioForm.title,
            description: portfolioForm.description,
            image_url: portfolioForm.image_url,
          })

        if (error) throw error
      }

      toast({
        title: "Portfolio atualizado", // t("toasts.portfolioUpdated")
        description: "Item do portfolio foi salvo com sucesso.",
      })
      setPortfolioDialogOpen(false)
      fetchPortfolio()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm(t("portfolio.deleteConfirm"))) return

    try {
      const { error } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast({
        title: t("portfolio.deleted"),
        description: t("portfolio.deletedDesc"),
      })
      fetchPortfolio()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    }
  };

  if (!profile) {
    return <div className="p-8 text-center">Carregando perfil...</div>
  }


  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <StatusBadge status={profile.provider_status || "inactive"} />
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">{t("tabs.profile")}</TabsTrigger>
            <TabsTrigger value="services">{t("tabs.services")}</TabsTrigger>
            <TabsTrigger value="portfolio">{t("tabs.portfolio")}</TabsTrigger>
            <TabsTrigger value="documents">{t("tabs.documents")}</TabsTrigger>
            <TabsTrigger value="reviews">{t("tabs.reviews")}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.provider_avatar_url || profile.avatar_url || ""} />
                    <AvatarFallback>{(profile.provider_full_name || profile.full_name)?.charAt(0) || profile.email.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-2">
                    <input
                      type="file"
                      id="provider-avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file || !profile) return

                        setLoading(true)
                        try {
                          const fileExt = file.name.split('.').pop()
                          const filePath = `${profile.id}/provider_avatar_${Date.now()}.${fileExt}`

                          const { error: uploadError } = await supabase.storage
                            .from('avatars')
                            .upload(filePath, file, { upsert: true })

                          if (uploadError) throw uploadError

                          const { data: { publicUrl } } = supabase.storage
                            .from('avatars')
                            .getPublicUrl(filePath)

                          const { error: updateError } = await updateProfile({
                            provider_avatar_url: publicUrl
                          })

                          if (updateError) throw new Error(updateError)

                          toast({ title: "Foto atualizada", description: "A sua foto de prestador foi atualizada." })
                        } catch (error: any) {
                          console.error("Upload error:", error)
                          toast({ title: "Erro no carregamento", description: `Não foi possível carregar a imagem: ${error.message || 'Erro desconhecido'}`, variant: "destructive" })
                        } finally {
                          setLoading(false)
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="provider-avatar-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar Foto de Prestador
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground">Esta foto será visível apenas no seu perfil de prestador.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Prestador</label>
                    <Select value={providerType} onValueChange={setProviderType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="company">Empresa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">NIF / VAT <span className="text-red-500">*</span></label>
                    <Input
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="Número de Identificação Fiscal"
                    />
                  </div>

                  {providerType === "company" ? (
                    <>
                      <div>
                        <label className="text-sm font-medium">Nome da Empresa</label>
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Ex: GigHub Solutions Lda"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t("fields.responsibleName")}</label>
                        <Input
                          value={providerFullName}
                          onChange={(e) => setProviderFullName(e.target.value)}
                          placeholder="Nome do contacto principal"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">{t("fields.professionalName")}</label>
                      <Input
                        value={providerFullName}
                        onChange={(e) => setProviderFullName(e.target.value)}
                        placeholder={t("fields.professionalNamePlaceholder")}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Nome Legal (Conta)</label>
                    <Input value={profile.full_name || ""} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input value={profile.email} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefone</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Seu número de telefone"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium">Localização / Código Postal</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <AddressAutocomplete
                            value={location}
                            onChange={(val) => {
                              setLocation(val)
                              setPostalCode(val) // Sync valid logic
                            }}
                            onSelect={(place) => {
                              if (place.geometry && place.geometry.location) {
                                setLat(place.geometry.location.lat())
                                setLng(place.geometry.location.lng())
                              }
                            }}
                            placeholder="Sua cidade ou código postal"
                          />
                          <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      {(lat && lng) && (
                        <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Coordenadas: {lat.toFixed(4)}, {lng.toFixed(4)}
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Raio de Atendimento
                        </Label>
                        <Badge variant="secondary" className="text-lg font-mono">
                          {serviceRadius} km
                        </Badge>
                      </div>
                      <Input
                        type="range"
                        min="1"
                        max="200"
                        step="1"
                        value={serviceRadius}
                        onChange={(e) => setServiceRadius(Number(e.target.value))}
                        className="h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("fields.radiusDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Website</label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://seusite.com"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                    <div>
                      <label className="text-sm font-medium">Anos de Experiência</label>
                      <Input
                        type="number"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Taxa Horária (€)</label>
                      <Input
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Disponibilidade</label>
                      <Select value={availability} onValueChange={setAvailability}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="busy">Ocupado</SelectItem>
                          <SelectItem value="limited">Disponibilidade Limitada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">{t("fields.bio")}</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t("fields.bioPlaceholder")}
                    rows={4}
                  />
                </div>

                <Button onClick={updateProfileData} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{profile.total_reviews || 0}</div>
                    <div className="text-sm text-muted-foreground">{t("stats.reviews")}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-2xl font-bold">{profile.rating?.toFixed(1) || "0.0"}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{t("stats.rating")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{completedJobs}</div>
                    <div className="text-sm text-muted-foreground">{t("stats.jobsCompleted")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Portfolio</CardTitle>
                <Button size="sm" onClick={handleAddPortfolio}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Trabalho
                </Button>
              </CardHeader>
              <CardContent>
                {portfolio.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t("portfolio.empty")}</p>
                    <Button className="mt-4" onClick={handleAddPortfolio}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("portfolio.addFirst")}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolio.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          {item.image_url && (
                            <img
                              src={item.image_url || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <h3 className="font-semibold">{item.title}</h3>
                          {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                          <div className="flex gap-2 justify-end mt-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditPortfolio(item)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePortfolio(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Documentos</CardTitle>
                <div className="flex gap-2 items-center">
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Identificação</SelectItem>
                      <SelectItem value="address">Comprovante de Morada</SelectItem>
                      <SelectItem value="certificate">Certificado</SelectItem>
                      <SelectItem value="insurance">Seguro</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="file"
                    id="profile-doc-upload"
                    className="hidden"
                    onChange={handleDocumentUpload}
                    disabled={uploadingDoc}
                  />
                  <Button size="sm" asChild disabled={uploadingDoc}>
                    <label htmlFor="profile-doc-upload">
                      {uploadingDoc ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {uploadingDoc ? "Enviando..." : "Enviar Documento"}
                    </label>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum documento enviado ainda.</p>
                    <Button className="mt-4">
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar Primeiro Documento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{doc.document_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Tipo: {doc.document_type} • Enviado em {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={doc.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <ServiceSelector
              userId={profile.id}
              initialSelectedServices={profile.skills || []}
              onSave={() => refreshProfile()}
            />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <ReviewsDisplay userId={profile.id} />
          </TabsContent>
        </Tabs>

        {/* Portfolio Dialog */}
        <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPortfolioId ? "Editar" : "Adicionar"} Trabalho ao Portfolio</DialogTitle>
              <DialogDescription>
                Adicione exemplos do seu trabalho para atrair mais clientes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="portfolio-title">Título do Projeto *</Label>
                <Input
                  id="portfolio-title"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                  placeholder="Nome do projeto"
                />
              </div>
              <div>
                <Label htmlFor="portfolio-description">Descrição</Label>
                <Textarea
                  id="portfolio-description"
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                  placeholder="Descreva o projeto e o seu papel..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="portfolio-image">URL da Imagem</Label>
                <Input
                  id="portfolio-image"
                  type="url"
                  value={portfolioForm.image_url}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, image_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPortfolioDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePortfolio} disabled={loading || !portfolioForm.title}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
