"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Bot, Sparkles, MapPin, Clock, Euro, Tag, FileText, Mic } from "lucide-react"
import { AIConversation } from "@/components/voice/ai-conversation"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

const categories = [
  "Cleaning",
  "Plumbing",
  "Electrical",
  "Painting",
  "Gardening",
  "Education",
  "Technology",
  "Transport",
  "Kitchen",
  "Others",
]

const cities = [
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

interface CollectedData {
  title?: string
  description?: string
  category?: string
  price?: number
  location?: string
  estimated_duration?: number
  duration_unit?: string
}

export default function CreateGigPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    location: "",
    estimated_duration: "",
    duration_unit: "hours",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAIConversation, setShowAIConversation] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<CollectedData | null>(null)

  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
  }, [user, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAIComplete = (data: CollectedData) => {
    console.log("AI Data received:", data)

    // Update form with AI suggestions
    if (data.title) setFormData((prev) => ({ ...prev, title: data.title! }))
    if (data.description) setFormData((prev) => ({ ...prev, description: data.description! }))
    if (data.category) setFormData((prev) => ({ ...prev, category: data.category! }))
    if (data.price) setFormData((prev) => ({ ...prev, price: data.price!.toString() }))
    if (data.location) setFormData((prev) => ({ ...prev, location: data.location! }))
    if (data.estimated_duration)
      setFormData((prev) => ({ ...prev, estimated_duration: data.estimated_duration!.toString() }))
    if (data.duration_unit) setFormData((prev) => ({ ...prev, duration_unit: data.duration_unit! }))

    setAiSuggestions(data)
    setShowAIConversation(false)

    toast({
      title: "Data filled automatically! ✨",
      description: "Review and adjust the data before publishing",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication error",
        description: "Log in to continue",
        variant: "destructive",
      })
      return
    }

    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Required fields",
        description: "Fill in title, description and category",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const gigData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.price ? Number.parseFloat(formData.price) : null,
        location: formData.location || null,
        estimated_duration: formData.estimated_duration ? Number.parseInt(formData.estimated_duration) : null,
        duration_unit: formData.duration_unit,
        user_id: user.id,
        status: "active",
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("gigs").insert([gigData]).select().single()

      if (error) {
        console.error("Error creating gig:", error)
        throw error
      }

      toast({
        title: "Gig created successfully! 🎉",
        description: "Your service has been published on the platform",
      })

      router.push("/dashboard/my-gigs")
    } catch (error) {
      console.error("Error creating gig:", error)
      toast({
        title: "Error creating gig",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearAISuggestions = () => {
    setAiSuggestions(null)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Gig</h1>
        <p className="text-gray-600">Publish your service and connect with clients worldwide</p>
      </div>

      {/* AI Assistant Card */}
      <Card className="mb-8 border-2 border-dashed border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <Bot className="h-5 w-5" />
            Intelligent AI Assistant
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardTitle>
          <CardDescription>
            Chat naturally and let AI automatically fill in your service details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowAIConversation(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Mic className="h-4 w-4 mr-2" />
              Chat with AI
            </Button>
            {aiSuggestions && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✨ Data filled by AI
                </Badge>
                <Button variant="outline" size="sm" onClick={clearAISuggestions} className="text-xs bg-transparent">
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Gig Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Ex: Complete house cleaning"
                    className={aiSuggestions?.title ? "border-green-300 bg-green-50" : ""}
                  />
                  {aiSuggestions?.title && <p className="text-xs text-green-600 mt-1">✨ Suggested by AI</p>}
                </div>

                <div>
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe in detail the service you offer..."
                    rows={4}
                    className={aiSuggestions?.description ? "border-green-300 bg-green-50" : ""}
                  />
                  {aiSuggestions?.description && <p className="text-xs text-green-600 mt-1">✨ Suggested by AI</p>}
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className={aiSuggestions?.category ? "border-green-300 bg-green-50" : ""}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            {category}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {aiSuggestions?.category && <p className="text-xs text-green-600 mt-1">✨ Suggested by AI</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location and Price
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location">Location (City)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Ex: London, NYC, Lisbon..."
                    className={aiSuggestions?.location ? "border-green-300 bg-green-50" : ""}
                  />
                  {aiSuggestions?.location && <p className="text-xs text-green-600 mt-1">✨ Suggested by AI</p>}
                </div>

                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="0.00"
                      className={`pl-10 ${aiSuggestions?.price ? "border-green-300 bg-green-50" : ""}`}
                    />
                  </div>
                  {aiSuggestions?.price && <p className="text-xs text-green-600 mt-1">✨ Suggested by AI</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Estimated Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.estimated_duration}
                      onChange={(e) => handleInputChange("estimated_duration", e.target.value)}
                      placeholder="2"
                      className={aiSuggestions?.estimated_duration ? "border-green-300 bg-green-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration_unit">Unit</Label>
                    <Select
                      value={formData.duration_unit}
                      onValueChange={(value) => handleInputChange("duration_unit", value)}
                    >
                      <SelectTrigger className={aiSuggestions?.duration_unit ? "border-green-300 bg-green-50" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(aiSuggestions?.estimated_duration || aiSuggestions?.duration_unit) && (
                  <p className="text-xs text-green-600 mt-1">✨ Suggested by AI</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Gig"
            )}
          </Button>
        </div>
      </form>

      {/* AI Conversation Modal */}
      <AIConversation
        isOpen={showAIConversation}
        onClose={() => setShowAIConversation(false)}
        onComplete={handleAIComplete}
      />
    </div>
  )
}
