"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Check, X, Search, Eye } from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"
import { useRouter } from "next/navigation"

type Gig = Database["public"]["Tables"]["gigs"]["Row"] & {
  profiles?: {
    full_name: string | null
    email: string | null
  }
}

import { useAuth } from "@/contexts/auth-context"
import { logClientActivity } from "@/app/actions/log"

export function GigsManagement() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editingGig, setEditingGig] = useState<Gig | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    location: "",
    status: "",
  })
  const { toast } = useToast()
  const router = useRouter()
  const { profile } = useAuth()

  useEffect(() => {
    fetchGigs()
  }, [])

  const fetchGigs = async () => {
    try {
      console.log("🔍 Admin: Fetching all gigs...")
      setLoading(true)

      const { data, error } = await supabase
        .from("gigs")
        .select(`
          *,
          profiles:author_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Admin: Error fetching gigs:", error)
        toast({
          title: "Error",
          description: "Could not load gigs.",
          variant: "destructive",
        })
        return
      }

      console.log(`✅ Admin: ${data?.length || 0} gigs loaded`)
      setGigs(data || [])
    } catch (err) {
      console.error("❌ Admin: Unexpected error:", err)
      toast({
        title: "Error",
        description: "Unexpected error loading gigs.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditGig = (gig: Gig) => {
    console.log("✏️ Admin: Editing gig:", gig.title)
    setEditingGig(gig)
    setEditForm({
      title: gig.title || "",
      description: gig.description || "",
      category: gig.category || "",
      price: gig.price?.toString() || "",
      location: gig.location || "",
      status: gig.status || "pending",
    })
  }

  const handleSaveGig = async () => {
    if (!editingGig) return

    try {
      console.log("💾 Admin: Saving gig changes:", editingGig.title)

      const { error } = await supabase
        .from("gigs")
        .update({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          price: Number.parseFloat(editForm.price) || 0,
          location: editForm.location,
          status: editForm.status as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingGig.id)

      if (error) {
        console.error("❌ Admin: Error updating gig:", error)
        toast({
          title: "Error",
          description: "Could not update gig.",
          variant: "destructive",
        })
        return
      }

      console.log("✅ Admin: Gig updated successfully")

      if (profile) {
        logClientActivity(profile.id, profile.role, "UPDATE_GIG_ADMIN", {
          gigId: editingGig.id,
          title: editForm.title,
          changes: editForm // Optionally log all changes
        })
      }

      toast({
        title: "Success",
        description: "Gig updated successfully.",
      })

      setEditingGig(null)
      fetchGigs() // Reload list
    } catch (err) {
      console.error("❌ Admin: Unexpected error:", err)
      toast({
        title: "Error",
        description: "Unexpected error updating gig.",
        variant: "destructive",
      })
    }
  }

  const handleApproveGig = async (gigId: string, gigTitle: string) => {
    try {
      console.log("✅ Admin: Approving gig:", gigTitle)

      const { error } = await supabase
        .from("gigs")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", gigId)

      if (error) {
        console.error("❌ Admin: Error approving gig:", error)
        toast({
          title: "Error",
          description: "Could not approve gig.",
          variant: "destructive",
        })
        return
      }

      console.log("✅ Admin: Gig approved successfully")

      if (profile) {
        logClientActivity(profile.id, profile.role, "APPROVE_GIG", { gigId, gigTitle })
      }

      toast({
        title: "Success",
        description: "Gig approved successfully.",
      })

      fetchGigs() // Reload list
    } catch (err) {
      console.error("❌ Admin: Unexpected error:", err)
      toast({
        title: "Error",
        description: "Unexpected error approving gig.",
        variant: "destructive",
      })
    }
  }

  const handleRejectGig = async (gigId: string, gigTitle: string) => {
    try {
      console.log("❌ Admin: Rejecting gig:", gigTitle)

      const { error } = await supabase
        .from("gigs")
        .update({
          status: "rejected",
          rejection_reason: "Rejected by administration",
          updated_at: new Date().toISOString(),
        })
        .eq("id", gigId)

      if (error) {
        console.error("❌ Admin: Error rejecting gig:", error)
        toast({
          title: "Error",
          description: "Could not reject gig.",
          variant: "destructive",
        })
        return
      }

      console.log("✅ Admin: Gig rejected successfully")

      if (profile) {
        logClientActivity(profile.id, profile.role, "REJECT_GIG", { gigId, gigTitle })
      }

      toast({
        title: "Success",
        description: "Gig rejected successfully.",
      })

      fetchGigs() // Reload list
    } catch (err) {
      console.error("❌ Admin: Unexpected error:", err)
      toast({
        title: "Error",
        description: "Unexpected error rejecting gig.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGig = async (gigId: string, gigTitle: string) => {
    try {
      console.log("🗑️ Admin: Deleting gig:", gigTitle)

      const { error } = await supabase.from("gigs").delete().eq("id", gigId)

      if (error) {
        console.error("❌ Admin: Error deleting gig:", error)
        toast({
          title: "Error",
          description: "Could not delete gig.",
          variant: "destructive",
        })
        return
      }

      console.log("✅ Admin: Gig deleted successfully")

      // Log the action
      if (profile) {
        logClientActivity(
          profile.id,
          profile.role,
          "DELETE_GIG_ADMIN",
          { gigId, gigTitle }
        )
      }

      toast({
        title: "Success",
        description: "Gig deleted successfully.",
        variant: "destructive", // Red toast for deletion
      })

      fetchGigs() // Reload list
    } catch (err) {
      console.error("❌ Admin: Unexpected error:", err)
      toast({
        title: "Error",
        description: "Unexpected error deleting gig.",
        variant: "destructive",
      })
    }
  }

  const filteredGigs = gigs.filter((gig) => {
    const matchesSearch =
      gig.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.category?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || gig.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading gigs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gigs Management</span>
            <Badge variant="outline">{gigs.length} gigs</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gigs List */}
      <div className="grid gap-4">
        {filteredGigs.map((gig) => (
          <Card key={gig.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{gig.title}</h3>
                      <p className="text-gray-600 mt-1 line-clamp-2">{gig.description}</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <Badge className={getStatusBadgeColor(gig.status || "pending")}>
                          {gig.status || "pending"}
                        </Badge>
                        <span className="text-sm text-gray-500">Category: {gig.category}</span>
                        <span className="text-sm font-medium text-green-600">€{Number(gig.price || 0).toFixed(2)}</span>
                        <span className="text-sm text-gray-500">📍 {gig.location}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Author: {gig.profiles?.full_name || "Name not informed"} ({gig.profiles?.email})
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Botões de Aprovação/Rejeição para gigs pendentes */}
                  {gig.status === "pending" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/admin/gigs/${gig.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600"
                        onClick={() => handleApproveGig(gig.id, gig.title || "")}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleRejectGig(gig.id, gig.title || "")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {/* Botão Editar */}
                  <Dialog
                    open={editingGig?.id === gig.id}
                    onOpenChange={(open) => {
                      if (!open) setEditingGig(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEditGig(gig)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Gig</DialogTitle>
                        <DialogDescription>Edit gig information for "{gig.title}"</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Input
                              id="category"
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="price">Price (€)</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              value={editForm.price}
                              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={editForm.location}
                              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                              value={editForm.status}
                              onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingGig(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveGig}>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Gig</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the gig <strong>"{gig.title}"</strong>? This action cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteGig(gig.id, gig.title || "")}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGigs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No gigs found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
