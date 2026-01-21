"use client"

export const runtime = "edge"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AlertTriangle,
    MapPin,
    Clock,
    CheckCircle,
    Loader2,
    Navigation,
    XCircle,
    Zap
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { EmergencyMap } from "@/components/dashboard/emergency-map"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

// Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export default function EmergencyRespondPage() {
    const { id } = useParams() as { id: string }
    const { user, profile } = useAuth()
    const router = useRouter()
    const [request, setRequest] = useState<EmergencyRequest | null>(null)
    const [client, setClient] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [minHours, setMinHours] = useState<number>(1)
    const [eta, setEta] = useState<string>("15 mins")

    const hourlyRate = profile?.hourly_rate || 20 // Default fallback if not set
    const premiumRate = hourlyRate * 1.5
    const totalQuote = premiumRate * minHours

    useEffect(() => {
        if (id) {
            loadRequest()
        }
    }, [id])

    const loadRequest = async () => {
        try {
            const { data, error } = await supabase
                .from("emergency_requests")
                .select("*")
                .eq("id", id)
                .single()

            if (error) throw error
            setRequest(data)

            // Load client info
            const { data: clientData } = await supabase
                .from("profiles")
                .select("full_name, rating, phone")
                .eq("id", data.client_id)
                .single()
            setClient(clientData)
        } catch (err) {
            console.error("Error loading emergency:", err)
            toast({ title: "Error", description: "This emergency may no longer be available", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const handleSendQuote = async () => {
        if (!user || !request) return
        setIsSubmitting(true)
        try {
            const { error } = await EmergencyService.respondToEmergency({
                requestId: request.id,
                providerId: user.id,
                quote: {
                    price_per_hour: premiumRate, // Store the premium rate
                    min_hours: minHours,
                    eta: eta
                }
            })

            if (error) throw error

            toast({ title: "Quote Sent!", description: "The client has been notified of your offer." })
            router.push(`/dashboard/emergency/${request.id}`)
        } catch (err: any) {
            console.error(err)
            toast({ title: "Failed to send quote", description: err.message, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-red-600" />
            <p className="text-gray-600">Loading emergency details...</p>
        </div>
    )

    if (!request) return <div>Emergency not found or already assigned.</div>

    const isAvailable = request.status === 'pending'

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <Card className="border-red-200 overflow-hidden shadow-2xl">
                <div className="bg-red-600 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <AlertTriangle className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Emergency Call</h1>
                            <p className="text-red-100 text-sm font-medium">Immediate response requested</p>
                        </div>
                    </div>
                    <Zap className="h-10 w-10 text-yellow-300 fill-current animate-pulse" />
                </div>

                <CardContent className="p-8 space-y-8">
                    {/* Category & Badge */}
                    <div className="grid grid-cols-2 gap-8 text-center bg-gray-50 rounded-2xl p-6">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Category</p>
                            <p className="text-xl font-bold text-gray-900">{request.category}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Base Rate</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-gray-400 line-through text-lg">{hourlyRate}€</span>
                                <span className="text-xl font-black text-green-600">{premiumRate}€ (1.5x)</span>
                            </div>
                        </div>
                    </div>

                    {/* Request Details */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-red-600" />
                            Location & Details
                        </h3>
                        <div className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
                            <p className="text-gray-700 leading-relaxed font-medium italic text-lg">"{request.description}"</p>

                            <div className="aspect-video bg-gray-100 rounded-xl border border-gray-200 overflow-hidden relative mt-4">
                                <EmergencyMap
                                    clientLat={request.lat}
                                    clientLng={request.lng}
                                    providerLat={profile?.last_lat}
                                    providerLng={profile?.last_lng}
                                    apiKey={GOOGLE_MAPS_API_KEY}
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t mt-4">
                                {request.lat && request.lng && profile?.last_lat && profile?.last_lng && (
                                    <span className="flex items-center gap-1 font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                        <Navigation className="h-4 w-4" />
                                        {calculateDistance(
                                            profile.last_lat,
                                            profile.last_lng,
                                            request.lat,
                                            request.lng
                                        ).toFixed(1)} km away
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-gray-400">
                                    <Clock className="h-4 w-4" />
                                    {Math.floor((new Date().getTime() - new Date(request.created_at).getTime()) / 60000)} mins ago
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RESPONSE FORM */}
                    {isAvailable ? (
                        <div className="bg-red-50/50 border-2 border-red-100 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">Send Quotation</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">Min. Hours</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.5"
                                            value={minHours}
                                            onChange={(e) => setMinHours(Number(e.target.value))}
                                            className="w-full h-14 pl-4 pr-12 rounded-xl border-gray-200 font-bold text-lg focus:ring-red-500 focus:border-red-500 shadow-sm"
                                        />
                                        <span className="absolute right-4 top-4 text-gray-400 font-medium">hrs</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">ETA (Arrival)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['15m', '30m', '45m', '1h'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setEta(t)}
                                                className={`h-14 rounded-xl font-bold text-sm transition-all ${eta === t ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-white border hover:bg-gray-50'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-red-100 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">Estimated Total (Before Fees)</span>
                                <span className="text-2xl font-black text-gray-900">{totalQuote.toFixed(2)}€</span>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <Button
                                    onClick={handleSendQuote}
                                    disabled={isSubmitting}
                                    className="h-16 bg-red-600 hover:bg-red-700 text-lg font-black uppercase tracking-widest shadow-xl shadow-red-200 transform active:scale-[0.99] transition-all"
                                >
                                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Zap className="h-5 w-5 mr-2 fill-current" />}
                                    SEND QUOTE ({totalQuote.toFixed(0)}€)
                                </Button>
                                <Button variant="ghost" className="text-gray-400" onClick={() => router.push('/dashboard')}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Ignore Request
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="font-bold text-gray-500 text-lg">This emergency has already been handled.</p>
                            <Button variant="link" onClick={() => router.push('/dashboard')} className="mt-2 text-red-600 font-bold">
                                Return to Dashboard
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}
