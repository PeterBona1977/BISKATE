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
    const [isAccepting, setIsAccepting] = useState(false)

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

    const handleAccept = async () => {
        if (!user || !request) return
        setIsAccepting(true)
        try {
            const { error } = await EmergencyService.acceptEmergency(request.id, user.id)
            if (error) throw error

            toast({ title: "Emergency Accepted!", description: "The client has been notified. Please head to the location immediately." })
            router.push(`/dashboard/emergency/${request.id}`)
        } catch (err: any) {
            toast({ title: "Failed to accept", description: err.message, variant: "destructive" })
        } finally {
            setIsAccepting(false)
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
        <div className="max-w-2xl mx-auto space-y-6">
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
                    <div className="grid grid-cols-2 gap-8 text-center bg-gray-50 rounded-2xl p-6">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Category</p>
                            <p className="text-xl font-bold text-gray-900">{request.category}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Earnings</p>
                            <p className="text-xl font-bold text-green-600 font-mono">1.5x Premium</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-red-600" />
                            Location & Details
                        </h3>
                        <div className="bg-white border rounded-xl p-4 space-y-3">
                            <p className="text-gray-700 leading-relaxed font-medium italic">"{request.description}"</p>
                            <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t text-[11px]">
                                {request.lat && request.lng && profile?.last_lat && profile?.last_lng && (
                                    <span className="flex items-center gap-1 font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                        <Navigation className="h-4 w-4" />
                                        {calculateDistance(
                                            profile.last_lat,
                                            profile.last_lng,
                                            request.lat,
                                            request.lng
                                        ).toFixed(1)} km de distância
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Reportado há {Math.floor((new Date().getTime() - new Date(request.created_at).getTime()) / 60000)} mins
                                </span>
                            </div>

                            <div className="aspect-video bg-gray-100 rounded-xl border border-gray-200 overflow-hidden relative mt-4">
                                <EmergencyMap
                                    clientLat={request.lat}
                                    clientLng={request.lng}
                                    providerLat={profile?.last_lat}
                                    providerLng={profile?.last_lng}
                                    apiKey={GOOGLE_MAPS_API_KEY}
                                />
                            </div>
                        </div>
                    </div>

                    {client && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Client Information
                            </h3>
                            <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                        {client.full_name[0]}
                                    </div>
                                    <span className="font-bold text-gray-900">{client.full_name}</span>
                                </div>
                                <Badge variant="outline" className="bg-white">{client.rating?.toFixed(1) || '5.0'} ★ Client</Badge>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 flex flex-col gap-3">
                        {isAvailable ? (
                            <>
                                <Button
                                    onClick={handleAccept}
                                    disabled={isAccepting}
                                    className="h-16 bg-red-600 hover:bg-red-700 text-lg font-black uppercase tracking-widest shadow-xl shadow-red-100 transform active:scale-95 transition-all"
                                >
                                    {isAccepting ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <CheckCircle className="h-6 w-6 mr-2" />}
                                    ACCEPT EMERGENCY
                                </Button>
                                <Button variant="ghost" className="text-gray-400" onClick={() => router.push('/dashboard')}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Decline
                                </Button>
                            </>
                        ) : (
                            <div className="text-center p-6 bg-gray-100 rounded-xl">
                                <p className="font-bold text-gray-500">This emergency has already been handled by another provider.</p>
                                <Button variant="link" onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}
