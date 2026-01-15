"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { ServiceSelector } from "@/components/provider/service-selector"
import { NotificationTriggers } from "@/lib/notifications/notification-triggers"
import { Plus, Trash2, Upload, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"

interface PortfolioItem {
  title: string
  description: string
  image_url: string
  file?: File
}

export default function BecomeProviderPage() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)

  // Form States
  const [formData, setFormData] = useState({
    skills: [] as string[],
    experience: "",
    hourly_rate: "",
    bio: "",
    phone: "",
    terms_accepted: false,
  })

  // Portfolio State
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false)
  const [newPortfolioItem, setNewPortfolioItem] = useState<PortfolioItem>({ title: "", description: "", image_url: "" })
  const [portfolioUploading, setPortfolioUploading] = useState(false)

  // Document State
  const [documents, setDocuments] = useState<{ [key: string]: File[] }>({
    id: [],
    certificate: [],
    insurance: []
  })

  // Other Documents State
  type OtherDocument = {
    id: string
    file: File | null
    description: string
  }
  const [otherDocuments, setOtherDocuments] = useState<OtherDocument[]>([])

  const addOtherDocument = () => {
    setOtherDocuments(prev => [...prev, { id: crypto.randomUUID(), file: null, description: "" }])
  }

  const removeOtherDocument = (id: string) => {
    setOtherDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  const updateOtherDocument = (id: string, field: 'file' | 'description', value: any) => {
    setOtherDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return { ...doc, [field]: value }
      }
      return doc
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, terms_accepted: checked }))
  }

  // Portfolio Handlers
  const handlePortfolioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPortfolioUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `portfolio-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage.from("portfolio").upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from("portfolio").getPublicUrl(fileName)
      setNewPortfolioItem(prev => ({ ...prev, image_url: publicUrl, file }))
    } catch (error) {
      console.error("Error uploading portfolio image:", error)
      toast({ title: "Upload failed", variant: "destructive" })
    } finally {
      setPortfolioUploading(false)
    }
  }

  const addPortfolioItem = () => {
    if (!newPortfolioItem.title || !newPortfolioItem.image_url) {
      toast({ title: "Missing fields", description: "Title and Image are required.", variant: "destructive" })
      return
    }
    setPortfolioItems(prev => [...prev, newPortfolioItem])
    setNewPortfolioItem({ title: "", description: "", image_url: "" })
    setIsPortfolioDialogOpen(false)
  }

  const removePortfolioItem = (index: number) => {
    setPortfolioItems(prev => prev.filter((_, i) => i !== index))
  }

  // Document Handlers
  // Document Handlers
  const handleDocumentUpload = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setDocuments(prev => ({
        ...prev,
        [type]: [...prev[type], ...Array.from(files)]
      }))
    }
  }

  const removeDocument = (type: string, index: number) => {
    setDocuments(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.terms_accepted) {
      toast({ title: "Error", description: "You must accept the terms and conditions.", variant: "destructive" })
      return
    }

    if (documents.id.length === 0) {
      toast({ title: "Missing Document", description: "National ID is mandatory.", variant: "destructive" })
      return
    }

    // Strict Phone Validation (Regex for various international formats)
    const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{9,15}$/
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
      toast({ title: "Invalid Phone", description: "Please enter a valid phone number including country code.", variant: "destructive" })
      return
    }

    if (!user) {
      toast({ title: "Error", description: "Authentication required.", variant: "destructive" })
      return
    }

    // Ensure profile exists in DB to prevent foreign key errors
    const { data: profileCheck } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()
    if (!profileCheck) {
      console.log("Profile missing during submission, trying to create...")
      // Try triggers or manual creation (simplified version of auth-context logic)
      const { error: createError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        updated_at: new Date().toISOString()
      })
      if (createError) {
        console.error("Critical: Could not create profile for application:", createError)
        toast({ title: "Profile Error", description: "Could not initialize your user profile. Please contact support.", variant: "destructive" })
        return
      }
    }

    try {
      setLoading(true)

      // 1. Upload Standard Documents
      const standardDocPromises = Object.entries(documents).flatMap(([type, files]) =>
        files.map(async (file) => {
          const fileExt = file.name.split(".").pop()
          const fileName = `${user.id}/${type}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload(fileName, file)
          if (uploadError) throw uploadError

          return {
            provider_id: user.id,
            document_type: type,
            document_name: file.name,
            document_url: uploadData.path,
            status: 'pending'
          }
        })
      )

      // 2. Upload Other Documents
      const otherDocPromises = otherDocuments.map(async (doc) => {
        if (!doc.file) return null
        const fileExt = doc.file.name.split(".").pop()
        const fileName = `${user.id}/other-${Date.now()}-${doc.id}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload(fileName, doc.file)
        if (uploadError) throw uploadError

        return {
          provider_id: user.id,
          document_type: 'other',
          document_name: doc.file.name,
          document_url: uploadData.path,
          description: doc.description,
          status: 'pending'
        }
      })

      const allDocs = (await Promise.all([...standardDocPromises, ...otherDocPromises])).filter(Boolean)

      // 3. Insert Documents into DB
      if (allDocs.length > 0) {
        const { error: docsDbError } = await supabase.from("provider_documents").insert(allDocs as any)
        if (docsDbError) throw docsDbError
      }

      // 3. Insert Portfolio Items
      const portfolioRecords = portfolioItems.map(item => ({
        provider_id: user.id,
        title: item.title,
        description: item.description,
        image_url: item.image_url
      }))

      if (portfolioRecords.length > 0) {
        const { error: portfolioError } = await supabase.from("portfolio_items").insert(portfolioRecords)
        if (portfolioError) throw portfolioError
      }

      // 4. Update Profile
      const { error: updateError } = await supabase.from("profiles").update({
        role: "provider_pending",
        is_provider: true,
        provider_status: "pending",
        bio: formData.bio || profile?.bio,
        skills: formData.skills,
        phone: formData.phone,
        phone_verified: false, // Explicitly false until admin verifies
        hourly_rate: Number.parseInt(formData.hourly_rate) || profile?.hourly_rate,
      }).eq("id", user.id)

      if (updateError) throw updateError

      // 5. Create Provider Record
      const { error: providerError } = await supabase.from("providers").insert({
        user_id: user.id,
        experience: formData.experience,
        status: "pending",
        application_date: new Date().toISOString(),
      })

      if (providerError) throw providerError

      // 6. Notifications
      await NotificationTriggers.triggerProviderApplicationSubmitted(
        user.id,
        profile?.full_name || user.email || "Unknown User",
        user.email || ""
      )

      await refreshProfile()

      toast({
        title: "Application Sent",
        description: "Your application is under review.",
      })

      router.push("/dashboard/provider/setup")
    } catch (error: any) {
      console.error("Error sending application:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You must be authenticated to access this page.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Become a Service Provider</CardTitle>
          <CardDescription>
            Join our network of professionals. Please fill out all required fields and upload necessary verification documents.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="space-y-2">
                <Label>Services Offered</Label>
                <div className="border rounded-md p-2">
                  <ServiceSelector
                    initialSelectedServices={formData.skills}
                    onSelectionChange={(services) => setFormData(prev => ({ ...prev, skills: services }))}
                    hideSaveButton={true}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biography *</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={handleChange}
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience *</Label>
                <Textarea
                  id="experience"
                  name="experience"
                  placeholder="Describe your professional experience..."
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($) *</Label>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">International format required. Admin will verify this number.</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Verification Documents</h3>

              <div className="space-y-2">
                <Label>National ID / Passport (Mandatory) *</Label>
                <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                  <Input
                    type="file"
                    onChange={(e) => handleDocumentUpload('id', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="mb-2"
                  />
                  {documents.id.length > 0 && (
                    <div className="space-y-2">
                      {documents.id.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-black border rounded">
                          <span className="flex items-center text-green-600 truncate mr-2">
                            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                            {file.name}
                          </span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument('id', idx)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Professional Certificates (Optional)</Label>
                <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                  <Input
                    type="file"
                    onChange={(e) => handleDocumentUpload('certificate', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="mb-2"
                  />
                  {documents.certificate.length > 0 && (
                    <div className="space-y-2">
                      {documents.certificate.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-black border rounded">
                          <span className="flex items-center text-green-600 truncate mr-2">
                            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                            {file.name}
                          </span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument('certificate', idx)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Insurance Documents (Optional)</Label>
                <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                  <Input
                    type="file"
                    onChange={(e) => handleDocumentUpload('insurance', e)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="mb-2"
                  />
                  {documents.insurance.length > 0 && (
                    <div className="space-y-2">
                      {documents.insurance.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-black border rounded">
                          <span className="flex items-center text-green-600 truncate mr-2">
                            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                            {file.name}
                          </span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument('insurance', idx)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Other Documents */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <Label>Other Documents</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOtherDocument}>
                    <Plus className="w-4 h-4 mr-1" /> Add Document
                  </Button>
                </div>
                {otherDocuments.map((doc, index) => (
                  <div key={doc.id} className="p-3 border rounded-md space-y-3 relative bg-slate-50 dark:bg-slate-900">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => removeOtherDocument(doc.id)}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                    </Button>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="e.g. Recommendation Letter"
                        value={doc.description}
                        onChange={(e) => updateOtherDocument(doc.id, 'description', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">File</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => updateOtherDocument(doc.id, 'file', e.target.files?.[0] || null)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Portfolio</h3>
                <Dialog open={isPortfolioDialogOpen} onOpenChange={setIsPortfolioDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" type="button"><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Portfolio Item</DialogTitle>
                      <DialogDescription>Add a new item to your professional portfolio.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={newPortfolioItem.title} onChange={e => setNewPortfolioItem(p => ({ ...p, title: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={newPortfolioItem.description} onChange={e => setNewPortfolioItem(p => ({ ...p, description: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Image *</Label>
                        <Input type="file" accept="image/*" onChange={handlePortfolioImageUpload} disabled={portfolioUploading} />
                        {portfolioUploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
                        {newPortfolioItem.image_url && <img src={newPortfolioItem.image_url} alt="Preview" className="h-32 object-cover rounded mt-2" />}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addPortfolioItem} disabled={!newPortfolioItem.title || !newPortfolioItem.image_url || portfolioUploading}>Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {portfolioItems.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground">No portfolio items added yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolioItems.map((item, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-4">
                        <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover rounded mb-2" />
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-white/80 hover:bg-white" onClick={() => removePortfolioItem(index)} type="button">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox id="terms" checked={formData.terms_accepted} onCheckedChange={handleCheckboxChange} required />
              <Label htmlFor="terms" className="text-sm">
                I accept the terms and conditions for service providers
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()} disabled={loading} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending Application..." : "Submit Application"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
