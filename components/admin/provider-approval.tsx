"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle, Eye, User, FileText, Phone, Check, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Provider {
  id: string
  full_name: string
  email: string
  provider_status: string
  bio: string | null
  avatar_url: string | null
  phone: string | null
  phone_verified: boolean
  created_at: string
  documents: Document[]
  portfolio: PortfolioItem[]
  specialties: Specialty[]
  hourly_rate: number | null
  provider_experience_years: number | null
  provider_availability: string | null
}

interface Specialty {
  id: string
  specialty_name: string
  experience_level: string
  years_experience: number
}

interface Document {
  id: string
  document_type: string
  document_name: string
  document_url: string
  status: string
  rejection_reason?: string
  description?: string
  created_at: string
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  image_url: string
}

export function ProviderApproval() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    setLoading(true)
    try {
      // Buscar prestadores pendentes
      const { data: providersData, error: providersError } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_provider", true)
        .in("provider_status", ["pending", "approved", "rejected"])
        .order("created_at", { ascending: false })

      if (providersError) throw providersError

      // Buscar documentos e portfolio para cada prestador
      const profiles = providersData as unknown as Provider[]
      const providersWithDetails = await Promise.all(
        profiles.map(async (provider) => {
          const { data: documents, error: docsError } = await supabase
            .from("provider_documents")
            .select("*")
            .eq("provider_id", provider.id)
            .order("created_at", { ascending: false })

          if (docsError) console.error("Error fetching docs", docsError)

          const { data: portfolio, error: portfolioError } = await supabase
            .from("provider_portfolio")
            .select("*")
            .eq("provider_id", provider.id)

          if (portfolioError) console.error("Error fetching portfolio", portfolioError)

          const { data: specialties, error: specialtiesError } = await supabase
            .from("provider_specialties")
            .select("*")
            .eq("provider_id", provider.id)

          if (specialtiesError) console.error("Error fetching specialties", specialtiesError)

          return {
            ...provider,
            documents: documents || [],
            portfolio: portfolio || [],
            specialties: specialties || []
          }
        }),
      )

      setProviders(providersWithDetails)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateProviderStatus = async (providerId: string, status: string, reason?: string) => {
    try {
      const response = await fetch("/api/admin/providers/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          providerId,
          status,
          reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update provider status")
      }

      toast({
        title: "Status updated",
        description: `Provider ${status === "approved" ? "approved" : "rejected"} successfully.`,
      })

      fetchProviders()
      setSelectedProvider(null)
      setRejectionReason("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const togglePhoneVerification = async (providerId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase
        .from("profiles") as any)
        .update({ phone_verified: !currentStatus })
        .eq("id", providerId)

      if (error) throw error

      toast({ title: "Phone Verification Updated" })

      // Update local state
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, phone_verified: !currentStatus } : p))
      if (selectedProvider && selectedProvider.id === providerId) {
        setSelectedProvider(prev => prev ? { ...prev, phone_verified: !currentStatus } : null)
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const updateDocumentStatus = async (providerId: string, docId: string, status: string, reason?: string) => {
    try {
      const { error } = await (supabase
        .from("provider_documents") as any)
        .update({ status, rejection_reason: reason })
        .eq("id", docId)

      if (error) throw error

      toast({
        title: "Document status updated",
        description: `Document set to ${status}.`,
      })

      // Update local state
      setProviders((prev) =>
        prev.map((p) => {
          if (p.id === providerId) {
            const updatedDocs = p.documents.map((d) => (d.id === docId ? { ...d, status, rejection_reason: reason } : d))
            return { ...p, documents: updatedDocs }
          }
          return p
        }),
      )

      if (selectedProvider && selectedProvider.id === providerId) {
        setSelectedProvider((prev) => {
          if (!prev) return null
          const updatedDocs = prev.documents.map((d) => (d.id === docId ? { ...d, status, rejection_reason: reason } : d))
          return { ...prev, documents: updatedDocs }
        })
      }
    } catch (err: any) {
      toast({
        title: "Error updating document",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      suspended: "destructive",
    } as const

    const labels = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      suspended: "Suspended",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const filterProviders = (status: string) => {
    return providers.filter((provider) => provider.provider_status === status)
  }

  const ProviderCard = ({ provider }: { provider: Provider }) => {
    return (
      <Card key={provider.id} className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={provider.avatar_url || ""} />
                <AvatarFallback>{provider.full_name?.charAt(0) || provider.email.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{provider.full_name || "Name not provided"}</h3>
                <p className="text-sm text-muted-foreground">{provider.email}</p>
                {provider.phone && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Phone className="w-3 h-3 mr-1" />
                    {provider.phone}
                    {provider.phone_verified && <ShieldCheck className="w-3 h-3 ml-1 text-green-600" />}
                  </div>
                )}
                {provider.bio && <p className="text-sm mt-2 line-clamp-2">{provider.bio}</p>}
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-muted-foreground">
                    Registered on {new Date(provider.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-muted-foreground">{provider.documents.length} document(s)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(provider.provider_status)}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setSelectedProvider(provider)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Provider Details</DialogTitle>
                    <DialogDescription>Full details of the service provider.</DialogDescription>
                  </DialogHeader>
                  {selectedProvider && (
                    <div className="space-y-6">
                      {/* Header Info */}
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedProvider.avatar_url || ""} />
                          <AvatarFallback>
                            {selectedProvider.full_name?.charAt(0) || selectedProvider.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-xl font-semibold">{selectedProvider.full_name || "Name not provided"}</h2>
                          <p className="text-muted-foreground">{selectedProvider.email}</p>

                          <div className="flex items-center space-x-4 mt-1">
                            {selectedProvider.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="w-4 h-4 mr-1 text-muted-foreground" />
                                {selectedProvider.phone}
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="phone-verify" className="text-sm">Phone Verified:</Label>
                              <Switch
                                id="phone-verify"
                                checked={selectedProvider.phone_verified}
                                onCheckedChange={() => togglePhoneVerification(selectedProvider.id, selectedProvider.phone_verified)}
                              />
                            </div>
                          </div>

                          <div className="mt-2">
                            {getStatusBadge(selectedProvider.provider_status)}
                          </div>
                        </div>
                      </div>



                      {/* Professional Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground uppercase">Hourly Rate</p>
                          <p className="font-medium text-lg">{selectedProvider.hourly_rate ? `€${selectedProvider.hourly_rate}/h` : "Not set"}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground uppercase">Experience</p>
                          <p className="font-medium text-lg">{selectedProvider.provider_experience_years || 0} years</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground uppercase">Availability</p>
                          <p className="font-medium text-lg capitalize">{selectedProvider.provider_availability || "Not set"}</p>
                        </div>
                      </div>

                      {/* Specialties Section */}
                      <div>
                        <h3 className="font-medium mb-2">Specialties & Skills</h3>
                        {(!selectedProvider.specialties || selectedProvider.specialties.length === 0) ? (
                          <p className="text-muted-foreground text-sm">No specialties listed.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {selectedProvider.specialties.map(s => (
                              <Badge key={s.id} variant="outline" className="flex flex-col items-start gap-1 py-1 px-3 h-auto">
                                <span className="font-bold">{s.specialty_name}</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                  {s.experience_level} • {s.years_experience}y exp
                                </span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedProvider.bio && (
                        <div>
                          <h3 className="font-medium mb-2">Biography</h3>
                          <p className="text-sm">{selectedProvider.bio}</p>
                        </div>
                      )}

                      {/* Portfolio Section */}
                      <div>
                        <h3 className="font-medium mb-4">Portfolio ({selectedProvider.portfolio.length})</h3>
                        {selectedProvider.portfolio.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No portfolio items.</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedProvider.portfolio.map(item => (
                              <Card key={item.id} className="overflow-hidden">
                                <div className="aspect-video relative">
                                  <img src={item.image_url} alt={item.title} className="object-cover w-full h-full" />
                                </div>
                                <div className="p-2">
                                  <p className="font-medium text-sm truncate" title={item.title}>{item.title}</p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Documents Section */}
                      {/* Documents Section */}
                      <div>
                        <h3 className="font-medium mb-4">Documents ({selectedProvider.documents.length})</h3>
                        {selectedProvider.documents.length === 0 ? (
                          <p className="text-muted-foreground">No documents uploaded.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedProvider.documents.map((doc) => (
                              <Card key={doc.id}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium">{doc.document_name}</h4>
                                    {getStatusBadge(doc.status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    <span className="font-medium">Type:</span> {doc.document_type}
                                    {doc.description && <span className="block mt-1 font-medium text-black dark:text-white">"{doc.description}"</span>}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.document_url, 60)
                                        if (error) throw error
                                        window.open(data.signedUrl, "_blank")
                                      } catch (err) {
                                        console.error("Error signing URL:", err)
                                        toast({ title: "Error opening document", variant: "destructive" })
                                      }
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                  {doc.status === "pending" && (
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                        onClick={() => updateDocumentStatus(selectedProvider.id, doc.id, "approved")}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                        onClick={() => {
                                          const reason = window.prompt("Reason for rejection:")
                                          if (reason) updateDocumentStatus(selectedProvider.id, doc.id, "rejected", reason)
                                        }}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedProvider.provider_status === "pending" && (
                        <div className="flex justify-end space-x-2 pt-4 border-t">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Provider</DialogTitle>
                                <DialogDescription>State the reason for rejection to notify the provider.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Rejection reason</label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explain the reason for rejection..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline">Cancel</Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => updateProviderStatus(selectedProvider.id, "rejected", rejectionReason)}
                                    disabled={!rejectionReason.trim()}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button onClick={() => updateProviderStatus(selectedProvider.id, "approved")}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Provider Approval</h1>
        <p className="text-muted-foreground">Manage service provider applications</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({filterProviders("pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({filterProviders("approved").length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({filterProviders("rejected").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Pending Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filterProviders("pending").length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending providers.</p>
                </div>
              ) : (
                filterProviders("pending").map((provider) => <ProviderCard key={provider.id} provider={provider} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Approved Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filterProviders("approved").length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No providers approved yet.</p>
                </div>
              ) : (
                filterProviders("approved").map((provider) => <ProviderCard key={provider.id} provider={provider} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                Rejected Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filterProviders("rejected").length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No providers rejected.</p>
                </div>
              ) : (
                filterProviders("rejected").map((provider) => <ProviderCard key={provider.id} provider={provider} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
