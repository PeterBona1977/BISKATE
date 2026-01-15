"use client"

import { useEffect, useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, X, MapPin, Clock, Euro, Tag, FileText, User, Sparkles, Check, ChevronRight, Crosshair } from "lucide-react"
import { PaymentInfoModal } from "./payment-info-modal"
import { GigNotificationService } from "@/lib/notifications/gig-notifications"
import { toast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"
import { logClientActivity } from "@/app/actions/log"

// Categories will be fetched dynamically
interface Category {
  id: string
  name: string
  subcategories: Category[]
  parent_id?: string
}

export function CreateGigForm() {
  const t = useTranslations("Dashboard.CreateGig")

  const gigSchema = z.object({
    title: z
      .string()
      .min(10, t("validation.titleMin"))
      .max(80, t("validation.titleMax")),
    description: z
      .string()
      .min(50, t("validation.descMin"))
      .max(1000, t("validation.descMax")),
    mainCategoryId: z.string().min(1, t("validation.categoryRequired")),
    subgroupId: z.string().optional(),
    serviceId: z.string().optional(),
    price: z.number().min(5, t("validation.priceMin")).max(10000, t("validation.priceMax")),
    deliveryTime: z.number().min(1, t("validation.timeMin")).max(365, t("validation.timeMax")),
    location: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    requirements: z.string().optional(),
    tags: z.array(z.string()).min(1, t("validation.tagsMin")).max(5, t("validation.tagsMax")),
  })

  type GigFormData = z.infer<typeof gigSchema>

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [gigData, setGigData] = useState<GigFormData | null>(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<GigFormData>({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      tags: [],
    },
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("name")
      if (error) throw error

      // Transform flat list to hierarchy
      const categoriesMap = new Map()
      const rootCategories: Category[] = []

      // First pass: create nodes
      data.forEach((cat: any) => {
        categoriesMap.set(cat.id, { ...cat, subcategories: [] })
      })

      // Second pass: link parents/children
      data.forEach((cat: any) => {
        if (cat.parent_id) {
          const parent = categoriesMap.get(cat.parent_id)
          if (parent) {
            parent.subcategories.push(categoriesMap.get(cat.id))
          }
        } else {
          rootCategories.push(categoriesMap.get(cat.id))
        }
      })

      setCategories(rootCategories)
    } catch (error) {
      console.error("Error loading categories", error)
    }
  }

  // Google Maps Autocomplete
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const loadGoogleMaps = () => {
      if (window.google) {
        initAutocomplete()
        return
      }

      if (document.getElementById("google-maps-script")) {
        const checkInterval = setInterval(() => {
          if (window.google) {
            initAutocomplete()
            clearInterval(checkInterval)
          }
        }, 100)
        return
      }

      const script = document.createElement("script")
      script.id = "google-maps-script"
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&loading=async`
      script.async = true
      script.defer = true
      script.onload = () => initAutocomplete()
      document.head.appendChild(script)
    }

    const initAutocomplete = () => {
      const input = document.getElementById("location") as HTMLInputElement
      if (!input || !window.google) return

      const attemptInit = () => {
        if (window.google?.maps?.places?.Autocomplete) {
          const autocomplete = new window.google.maps.places.Autocomplete(input, {
            types: ["(cities)"],
          })

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace()
            if (place.geometry) {
              setValue("lat", place.geometry.location.lat(), { shouldDirty: true })
              setValue("lng", place.geometry.location.lng(), { shouldDirty: true })
              setValue("location", place.formatted_address || place.name || "", { shouldDirty: true })
            }
          })
          return true
        }
        return false
      }

      if (!attemptInit()) {
        const interval = setInterval(() => {
          if (attemptInit()) clearInterval(interval)
        }, 100)
        setTimeout(() => clearInterval(interval), 5000)
      }
    }

    loadGoogleMaps()
  }, [setValue])

  const mainCategoryId = watch("mainCategoryId")
  const subgroupId = watch("subgroupId")
  const serviceId = watch("serviceId")

  const selectedMainCategory = categories.find((c) => c.id === mainCategoryId)
  const selectedSubgroup = selectedMainCategory?.subcategories.find((c) => c.id === subgroupId)

  const handleSuggestCategories = async () => {
    const title = watch("title")
    const description = watch("description")

    if (!title || !description || title.length < 10 || description.length < 50) {
      toast({
        title: t("ai.insufficientInfo"),
        description: t("ai.fillInfoFirst"),
        variant: "destructive",
      })
      return
    }

    setIsSuggesting(true)
    try {
      const response = await fetch("/api/ai/suggest-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })

      if (!response.ok) throw new Error("Falha ao obter sugestões")

      const data = await response.json()
      setSuggestions(data.suggestions || [])

      if (data.suggestions?.length === 0) {
        toast({
          title: t("ai.noSuggestions"),
          description: t("ai.noSuggestionsDesc"),
        })
      }
    } catch (error) {
      console.error("Error suggesting categories:", error)
      toast({
        title: t("Common.error"),
        description: t("ai.errorProcessing"),
        variant: "destructive",
      })
    } finally {
      setIsSuggesting(false)
    }
  }

  const applySuggestion = (suggestion: any) => {
    // Find the hierarchy for this suggestion
    const findPath = (cats: Category[], targetId: string, currentPath: string[] = []): string[] | null => {
      for (const cat of cats) {
        if (cat.id === targetId) return [...currentPath, cat.id]
        if (cat.subcategories && cat.subcategories.length > 0) {
          const path = findPath(cat.subcategories, targetId, [...currentPath, cat.id])
          if (path) return path
        }
      }
      return null
    }

    const path = findPath(categories, suggestion.id)
    if (path) {
      // Clear previous values first to avoid inconsistencies
      setValue("mainCategoryId", "")
      setValue("subgroupId", "")
      setValue("serviceId", "")

      if (path[0]) setValue("mainCategoryId", path[0])
      if (path[1]) setValue("subgroupId", path[1])
      if (path[2]) setValue("serviceId", path[2])

      setSuggestions([])
      toast({
        title: t("ai.suggestionApplied"),
        description: t("ai.categorySetTo", { path: suggestion.path }),
      })
    }
  }

  // Helper to get the actual leaf node ID for the database
  const getLeafServiceId = (data: GigFormData) => {
    return data.serviceId || data.subgroupId || data.mainCategoryId
  }

  const addTag = () => {
    if (newTag.trim() && tags.length < 5 && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      setValue("tags", updatedTags)
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove)
    setTags(updatedTags)
    setValue("tags", updatedTags)
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: t("Common.error"),
        description: t("validation.geoNotSupported"),
        variant: "destructive",
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setValue("lat", latitude)
        setValue("lng", longitude)

        try {
          if (window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder()
            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const address = results[0].formatted_address
                setValue("location", address, { shouldDirty: true, shouldValidate: true })
                toast({
                  title: t("validation.locationIdentified"),
                  description: address,
                })
              } else {
                console.warn("Geocoder status:", status)
                const coordString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                setValue("location", coordString, { shouldDirty: true, shouldValidate: true })

                let errorMsg = t("validation.coordsCaptured")
                if (status === "REQUEST_DENIED") {
                  errorMsg = t("validation.accessDenied")
                } else if (status === "ZERO_RESULTS") {
                  errorMsg = t("validation.noAddressFound")
                }

                toast({
                  title: t("validation.locationCaptured"),
                  description: errorMsg,
                  variant: "default",
                })
              }
            })
          } else {
            // Fallback to fetch
            const coordString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            setValue("location", coordString, { shouldDirty: true, shouldValidate: true })
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            )
            const data = await response.json()
            if (data.status === "OK" && data.results && data.results[0]) {
              setValue("location", data.results[0].formatted_address, { shouldDirty: true, shouldValidate: true })
            } else if (data.status === "REQUEST_DENIED") {
              console.error("Fetch Geocode Request Denied:", data.error_message)
            }
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error)
        }
      },
      (error) => {
        toast({
          title: t("Common.error"),
          description: t("validation.locationError"),
          variant: "destructive",
        })
      }
    )
  }

  const onSubmit = async (data: GigFormData) => {
    setIsSubmitting(true)
    try {
      // Simular validação
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setGigData(data)
      setShowPaymentModal(true)
    } catch (error) {
      console.error("Erro ao criar gig:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = async () => {
    if (gigData) {
      // Create the gig in the database first
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: newGig, error } = await supabase.from("gigs").insert({
        title: gigData.title,
        description: gigData.description,
        category: getLeafServiceId(gigData), // Save the deepest selected level
        author_id: userData.user.id,
        price: gigData.price,
        location: gigData.location,
        lat: gigData.lat,
        lng: gigData.lng,
        requirements: [gigData.requirements].filter(Boolean) as string[],
        status: 'published'
      }).select().single()

      if (error) {
        console.error("Error creating gig:", error)
        toast({
          title: t("ai.errorCreating"),
          description: error.message,
          variant: "destructive"
        })
        return
      }

      await GigNotificationService.notifyMatchingProviders({
        id: newGig.id,
        title: gigData.title,
        category: getLeafServiceId(gigData),
        price: gigData.price,
        location: gigData.location,
        lat: gigData.lat,
        lng: gigData.lng,
      })

      // Log Activity
      await logClientActivity(userData.user.id, 'user', 'CREATE_GIG', {
        gigId: newGig.id,
        title: gigData.title,
        category: getLeafServiceId(gigData),
        price: gigData.price
      })

      toast({
        title: t("ai.success"),
        description: t("ai.successDesc"),
      })
    }

    setShowPaymentModal(false)
    reset()
    setTags([])
    // Redirecionar para o dashboard
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("form.formTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("form.titleLabel")}
              </Label>
              <Input
                id="title"
                placeholder={t("form.titlePlaceholder")}
                {...register("title")}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              <p className="text-xs text-gray-500">{watch("title")?.length || 0}/80 {t("form.chars")}</p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("form.descriptionLabel")}</Label>
              <Textarea
                id="description"
                placeholder={t("form.descriptionPlaceholder")}
                rows={6}
                {...register("description")}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
              <p className="text-xs text-gray-500">{watch("description")?.length || 0}/1000 {t("form.chars")}</p>
            </div>

            {/* Categoria e Subcategoria */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t("form.categorizationLabel")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestCategories}
                  disabled={isSuggesting}
                  className="flex items-center gap-2 border-primary/50 hover:bg-primary/10"
                >
                  {isSuggesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                  {isSuggesting ? t("ai.analyzing") : t("ai.suggestBtn")}
                </Button>
              </div>

              {suggestions.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {t("ai.suggestionsTitle")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => applySuggestion(suggestion)}
                        className="text-left p-2 rounded border border-primary/10 bg-background hover:border-primary transition-colors text-xs flex justify-between items-center group"
                      >
                        <span className="truncate mr-2">{suggestion.path}</span>
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 shrink-0">
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSuggestions([])}
                    className="text-xs h-7"
                  >
                    {t("ai.clearSuggestions")}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("form.mainCategoryLabel")}</Label>
                  <Select
                    value={mainCategoryId}
                    onValueChange={(value) => {
                      setValue("mainCategoryId", value)
                      setValue("subgroupId", "")
                      setValue("serviceId", "")
                    }}
                  >
                    <SelectTrigger className={errors.mainCategoryId ? "border-red-500" : ""}>
                      <SelectValue placeholder={t("form.selectPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.mainCategoryId && <p className="text-sm text-red-500">{errors.mainCategoryId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t("form.subgroupLabel")}</Label>
                  <Select
                    disabled={!mainCategoryId || !selectedMainCategory?.subcategories.length}
                    value={subgroupId}
                    onValueChange={(value) => {
                      setValue("subgroupId", value)
                      setValue("serviceId", "")
                    }}
                  >
                    <SelectTrigger className={errors.subgroupId ? "border-red-500" : ""}>
                      <SelectValue placeholder={!selectedMainCategory?.subcategories.length ? t("form.noSubgroup") : t("form.selectPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMainCategory?.subcategories.map((subgroup) => (
                        <SelectItem key={subgroup.id} value={subgroup.id}>
                          {subgroup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subgroupId && <p className="text-sm text-red-500">{errors.subgroupId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t("form.serviceLabel")}</Label>
                  <Select
                    disabled={!subgroupId || !selectedSubgroup?.subcategories.length}
                    value={serviceId}
                    onValueChange={(value) => setValue("serviceId", value)}
                  >
                    <SelectTrigger className={errors.serviceId ? "border-red-500" : ""}>
                      <SelectValue placeholder={!selectedSubgroup?.subcategories.length ? t("form.noService") : t("form.selectPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSubgroup?.subcategories.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.serviceId && <p className="text-sm text-red-500">{errors.serviceId.message}</p>}
                </div>
              </div>
            </div>

            {/* Preço e Tempo de Entrega */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  {t("form.priceLabel")}
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="5"
                  max="10000"
                  placeholder="25"
                  {...register("price", { valueAsNumber: true })}
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("form.deliveryTimeLabel")}
                </Label>
                <Input
                  id="deliveryTime"
                  type="number"
                  min="1"
                  max="365"
                  placeholder="7"
                  {...register("deliveryTime", { valueAsNumber: true })}
                  className={errors.deliveryTime ? "border-red-500" : ""}
                />
                {errors.deliveryTime && <p className="text-sm text-red-500">{errors.deliveryTime.message}</p>}
              </div>
            </div>

            {/* Localização (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("form.locationLabel")}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  placeholder={t("form.locationPlaceholder")}
                  {...register("location")}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGetCurrentLocation}
                  title="Obter localização atual"
                >
                  <Crosshair className="h-4 w-4" />
                </Button>
              </div>
              {watch("lat") && (
                <p className="text-[10px] text-muted-foreground italic">
                  {t("form.capturedCoords", { lat: watch("lat")?.toFixed(4), lng: watch("lng")?.toFixed(4) })}
                </p>
              )}
              <p className="text-xs text-gray-500">{t("form.remoteHint")}</p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t("form.tagsLabel")}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={t("form.tagsPlaceholder")}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  disabled={tags.length >= 5}
                />
                <Button type="button" onClick={addTag} disabled={!newTag.trim() || tags.length >= 5} variant="outline">
                  {t("form.addTagBtn")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
              {errors.tags && <p className="text-sm text-red-500">{errors.tags.message}</p>}
            </div>

            {/* Requisitos do Cliente (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="requirements" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("form.clientRequirementsLabel")}
              </Label>
              <Textarea
                id="requirements"
                placeholder={t("form.clientRequirementsPlaceholder")}
                rows={3}
                {...register("requirements")}
              />
              <p className="text-xs text-gray-500">{t("form.clientRequirementsHint")}</p>
            </div>

            {/* Informação sobre taxas */}
            <Alert>
              <AlertDescription>
                <strong>{t("form.feesAlert")}</strong> {t("form.feesDesc")}
              </AlertDescription>
            </Alert>

            {/* Botão de Submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("form.submitting")}
                </>
              ) : (
                t("form.submitBtn")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      {showPaymentModal && gigData && (
        <PaymentInfoModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          gigData={gigData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

export default CreateGigForm
