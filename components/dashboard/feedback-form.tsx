"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Send, MessageSquare, AlertCircle, Sparkles, Bug } from "lucide-react"
import { NotificationTriggers } from "@/lib/notifications/notification-triggers"

export function FeedbackForm() {
    const { user, profile } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        category: "suggestion",
        subject: "",
        message: "",
        rating: 5,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            toast({
                title: "Login Required",
                description: "You must be logged in to submit feedback.",
                variant: "destructive",
            })
            return
        }

        if (!formData.subject.trim() || !formData.message.trim()) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all required fields.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            const { data: feedback, error } = await supabase
                .from("user_feedback")
                .insert({
                    user_id: user.id,
                    category: formData.category,
                    subject: formData.subject,
                    message: formData.message,
                    rating: formData.rating,
                    status: "pending",
                })
                .select()
                .single()

            if (error) throw error

            toast({
                title: "Feedback Submitted! 🎉",
                description: "Thank you for helping us improve Biskate. Our team will review it shortly.",
            })

            // Trigger Admin Notification
            await NotificationTriggers.triggerFeedbackReceived(
                feedback.id,
                user.id,
                profile?.full_name || user.email || "Anonymous",
                formData.category,
                formData.subject
            )

            // Reset form
            setFormData({
                category: "suggestion",
                subject: "",
                message: "",
                rating: 5,
            })
        } catch (error: any) {
            console.error("Error submitting feedback:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to submit feedback. Please try again later.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-2xl mx-auto shadow-lg border-indigo-100">
            <CardHeader className="bg-indigo-50/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                    Feedback & Support
                </CardTitle>
                <CardDescription>
                    Help us improve your experience or report a bug. We read every message!
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bug">
                                        <div className="flex items-center gap-2">
                                            <Bug className="h-4 w-4 text-red-500" />
                                            <span>Bug Report</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="suggestion">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-yellow-500" />
                                            <span>Suggestion</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="complaint">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-orange-500" />
                                            <span>Complaint</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="praise">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-green-500" />
                                            <span>Praise</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rating">Platform Rating (1-5)</Label>
                            <Select
                                value={formData.rating.toString()}
                                onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                            >
                                <SelectTrigger id="rating">
                                    <SelectValue placeholder="Rate your experience" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 4, 3, 2, 1].map((n) => (
                                        <SelectItem key={n} value={n.toString()}>
                                            {n} Stars {n === 5 ? "⭐⭐⭐⭐⭐" : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Summary of your feedback"
                            required
                            className="focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Tell us more about it..."
                            rows={5}
                            required
                            className="resize-none focus-visible:ring-indigo-500"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 transition-all duration-200"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-5 w-5" />
                                Submit Feedback
                            </>
                        )}
                    </Button>

                    <p className="text-center text-xs text-gray-500 italic">
                        Your feedback helps us build a better platform for everyone.
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
