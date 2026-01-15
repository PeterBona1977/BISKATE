"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Star, Bug, Lightbulb, Heart, Reply, Check, Clock, User, Calendar, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Feedback {
  id: string
  user_id: string
  category: string
  subject: string
  message: string
  rating: number | null
  status: string
  admin_response: string | null
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string
    email: string
  }
}

export function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [adminResponse, setAdminResponse] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("user_feedback")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching feedback:", error)
        toast({
          title: "Error",
          description: "Error loading feedback",
          variant: "destructive",
        })
        return
      }

      setFeedbacks(data || [])
    } catch (err) {
      console.error("❌ Exception fetching feedback:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRespondToFeedback = async (feedbackId: string) => {
    if (!adminResponse.trim()) {
      toast({
        title: "Error",
        description: "Please write a response",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("user_feedback")
        .update({
          admin_response: adminResponse,
          status: "responded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedbackId)

      if (error) {
        toast({
          title: "Error",
          description: "Error sending response",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Response sent successfully",
      })

      setAdminResponse("")
      setSelectedFeedback(null)
      fetchFeedbacks()
    } catch (err) {
      console.error("❌ Error responding to feedback:", err)
    }
  }

  const handleMarkAsResolved = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from("user_feedback")
        .update({
          status: "resolved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedbackId)

      if (error) {
        toast({
          title: "Error",
          description: "Error marking as resolved",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Feedback marked as resolved",
      })

      fetchFeedbacks()
    } catch (err) {
      console.error("❌ Error marking as resolved:", err)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bug":
        return <Bug className="h-4 w-4" />
      case "suggestion":
        return <Lightbulb className="h-4 w-4" />
      case "compliment":
        return <Heart className="h-4 w-4" />
      case "complaint":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "bug":
        return "bg-red-100 text-red-800 border-red-200"
      case "suggestion":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "compliment":
        return "bg-green-100 text-green-800 border-green-200"
      case "complaint":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "responded":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const categoryMatch = filterCategory === "all" || feedback.category === filterCategory
    const statusMatch = filterStatus === "all" || feedback.status === filterStatus
    return categoryMatch && statusMatch
  })

  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter((f) => f.status === "pending").length,
    responded: feedbacks.filter((f) => f.status === "responded").length,
    resolved: feedbacks.filter((f) => f.status === "resolved").length,
    averageRating:
      feedbacks.filter((f) => f.rating).reduce((acc, f) => acc + (f.rating || 0), 0) /
      feedbacks.filter((f) => f.rating).length || 0,
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Loading feedback...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Responded</p>
                <p className="text-2xl font-bold text-blue-600">{stats.responded}</p>
              </div>
              <Reply className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : "N/A"}
                </p>
              </div>
              <Star className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="bug">Bugs</SelectItem>
                  <SelectItem value="suggestion">Suggestions</SelectItem>
                  <SelectItem value="compliment">Compliments</SelectItem>
                  <SelectItem value="complaint">Complaints</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>User Feedback ({filteredFeedbacks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No feedback found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedbacks.map((feedback) => (
                <Card key={feedback.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getCategoryColor(feedback.category)}`}>
                            {getCategoryIcon(feedback.category)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{feedback.subject}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getCategoryColor(feedback.category)}>
                                {feedback.category.toUpperCase()}
                              </Badge>
                              <Badge className={getStatusColor(feedback.status)}>{feedback.status.toUpperCase()}</Badge>
                              {feedback.rating && (
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm ml-1">{feedback.rating}/5</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {feedback.profiles?.full_name || "User"}
                          </div>
                          <div className="flex items-center mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Mensagem */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">{feedback.message}</p>
                      </div>

                      {/* Resposta do admin (se existir) */}
                      {feedback.admin_response && (
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
                          <h4 className="font-medium text-blue-900 mb-2">Administrator's Response:</h4>
                          <p className="text-blue-800">{feedback.admin_response}</p>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">Email: {feedback.profiles?.email}</div>

                        <div className="flex space-x-2">
                          {feedback.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFeedback(feedback)
                                setAdminResponse("")
                              }}
                            >
                              <Reply className="h-4 w-4 mr-2" />
                              Respond
                            </Button>
                          )}

                          {feedback.status !== "resolved" && (
                            <Button variant="outline" size="sm" onClick={() => handleMarkAsResolved(feedback.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Mark as Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de resposta */}
      {selectedFeedback && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Respond to Feedback</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFeedback(null)}>
                  ✕
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{selectedFeedback.subject}</h4>
                <p className="text-gray-700">{selectedFeedback.message}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your Response</label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Write your response here..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleRespondToFeedback(selectedFeedback.id)}>Send Response</Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
