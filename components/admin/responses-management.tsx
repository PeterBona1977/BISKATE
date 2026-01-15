"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  X,
  Clock,
  User,
  Calendar,
  MapPin,
  Euro,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"

type GigResponse = Database["public"]["Tables"]["gig_responses"]["Row"] & {
  gig: Database["public"]["Tables"]["gigs"]["Row"]
  provider: Database["public"]["Tables"]["profiles"]["Row"]
  client: Database["public"]["Tables"]["profiles"]["Row"]
}

interface ProposalStats {
  total: number
  pending: number
  accepted: number
  rejected: number
}

export function ResponsesManagement() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [proposals, setProposals] = useState<GigResponse[]>([])
  const [filteredProposals, setFilteredProposals] = useState<GigResponse[]>([])
  const [stats, setStats] = useState<ProposalStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTab, setSelectedTab] = useState("all")

  useEffect(() => {
    loadProposals()
  }, [])

  useEffect(() => {
    filterProposals()
  }, [proposals, searchTerm, statusFilter, selectedTab])

  const loadProposals = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("gig_responses")
        .select(`
          *,
          gig:gigs!inner (*),
          provider:profiles!gig_responses_provider_id_fkey (*),
          client:profiles!gig_responses_client_id_fkey (*)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading proposals:", error)
        toast({
          title: "Error",
          description: "Could not load proposals",
          variant: "destructive",
        })
        return
      }

      const typedProposals = (data as GigResponse[]) || []
      setProposals(typedProposals)

      // Calcular estatísticas
      const newStats = {
        total: typedProposals.length,
        pending: typedProposals.filter((p) => p.status === "pending").length,
        accepted: typedProposals.filter((p) => p.status === "accepted").length,
        rejected: typedProposals.filter((p) => p.status === "rejected").length,
      }
      setStats(newStats)
    } catch (error) {
      console.error("Error loading proposals:", error)
      toast({
        title: "Error",
        description: "Unexpected error loading proposals",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterProposals = () => {
    let filtered = proposals

    // Filtrar por tab
    if (selectedTab !== "all") {
      filtered = filtered.filter((p) => p.status === selectedTab)
    }

    // Filtrar por status adicional
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.gig?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.provider?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.message?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredProposals(filtered)
  }

  const handleDeleteProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase.from("gig_responses").delete().eq("id", proposalId)

      if (error) {
        console.error("Error deleting proposal:", error)
        toast({
          title: "Error",
          description: "Could not delete proposal",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Proposal deleted successfully",
      })

      loadProposals()
    } catch (error) {
      console.error("Error deleting proposal:", error)
      toast({
        title: "Error",
        description: "Unexpected error deleting proposal",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (proposalId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("gig_responses")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId)

      if (error) {
        console.error("Error updating status:", error)
        toast({
          title: "Error",
          description: "Could not update status",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Status updated successfully",
      })

      loadProposals()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Unexpected error updating status",
        variant: "destructive",
      })
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "A few minutes ago"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString("en-GB")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Accepted
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proposals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Proposal Management</h1>
        <p className="text-gray-600 mt-2">Manage all proposals sent by providers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by gig, provider, client, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({stats.accepted})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6">
          {filteredProposals.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting the search filters"
                    : "Proposals will appear here when providers send offers"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProposals.map((proposal) => (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={proposal.provider?.avatar_url || ""} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{proposal.provider?.full_name || "Provider"}</h3>
                          <p className="text-sm text-gray-600">For: {proposal.client?.full_name || "Client"}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatTimeAgo(proposal.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">{getStatusBadge(proposal.status)}</div>
                    </div>

                    {/* Gig Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Gig: {proposal.gig?.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {proposal.gig?.location}
                        </div>
                        <div className="flex items-center">
                          <Euro className="h-4 w-4 mr-1" />€{Number(proposal.gig?.price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Proposal Message */}
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Proposal Message:</h5>
                      <p className="text-gray-700 bg-white border rounded-lg p-3">
                        {proposal.message || "No message"}
                      </p>
                    </div>

                    {/* Proposal Details */}
                    {proposal.proposed_price && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Proposed Price:</span>
                          <span className="font-semibold text-green-600">
                            €{Number(proposal.proposed_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex space-x-2">
                        {proposal.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => handleUpdateStatus(proposal.id, "accepted")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(proposal.id, "rejected")}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this proposal? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProposal(proposal.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
