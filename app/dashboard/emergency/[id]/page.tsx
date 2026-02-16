
"use client"

export const runtime = "edge"
export const dynamic = "force-dynamic"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    AlertTriangle,
    MapPin,
    Clock,
    User,
    Phone,
    ShieldCheck,
    ChevronLeft,
    Loader2,
    Navigation,
    Star,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Info
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { RealtimeChat } from "@/components/chat/realtime-chat"
import { EmergencyService, EmergencyRequest, EmergencyResponse } from "@/lib/emergency/emergency-service"
import { toast } from "@/hooks/use-toast"
import { EmergencyMap } from "@/components/dashboard/emergency-map"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

export default function EmergencyTrackingPage() {
    const { id } = useParams() as { id: string }
    const router = useRouter()

    const [request, setRequest] = useState<EmergencyRequest | null>(null)
    const [responses, setResponses] = useState<EmergencyResponse[]>([])
    const [onlineProviders, setOnlineProviders] = useState<any[]>([])
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [isSelecting, setIsSelecting] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [chatOpen, setChatOpen] = useState(false)

    useEffect(() => {
        if (id) {
            loadInitialData()

            // 5-minute periodic notification for pending search
            const pulseInterval = setInterval(() => {
                if (request?.status === 'pending') {
                    toast({
                        title: "Ainda a procurar...",
                        description: "Nós não esquecemos: a sua busca continua ativa e os técnicos estão a ser notificados.",
                    })
                }
            }, 5 * 60 * 1000)

            // Subscribe to Request changes
            const requestSub = supabase
                .channel(`req_${id}`)
                .on("postgres_changes", { event: "*", schema: "public", table: "emergency_requests", filter: `id=eq.${id}` },
                    (payload) => {
                        setRequest(prev => ({ ...prev, ...payload.new } as EmergencyRequest))
                    }
                )
                .subscribe()

            // Subscribe to Responses
            const responseSub = supabase
                .channel(`resp_${id}`)
                .on("postgres_changes", { event: "*", schema: "public", table: "emergency_responses", filter: `emergency_id=eq.${id}` },
                    () => {
                        fetchResponses()
                    }
                )
                .subscribe()

            return () => {
                clearInterval(pulseInterval)
                requestSub.unsubscribe()
                responseSub.unsubscribe()
            }
        }
    }, [id, request?.status])

    const loadInitialData = async () => {
        try {
            setLoading(true)
            await Promise.all([
                fetchRequest(),
                fetchResponses(),
                fetchOnlineProviders()
            ])
        } finally {
            setLoading(false)
        }
    }

    const fetchRequest = async () => {
        const { data } = await supabase.from("emergency_requests").select("*").eq("id", id).single()
        if (data) setRequest(data)
    }

    const fetchResponses = async () => {
        const { data } = await supabase
            .from("emergency_responses")
            .select("*, provider:profiles(*)")
            .eq("emergency_id", id)
        if (data) setResponses(data)
    }

    const fetchOnlineProviders = async () => {
        // Fetch providers who are online and match skills (simplified here)
        const { data } = await supabase
            .from("profiles")
            .select("id, full_name, last_lat, last_lng, is_online")
            .eq("is_online", true)
            .eq("is_provider", true)
            .limit(10)
        if (data) setOnlineProviders(data)
    }

    const handleAcceptProvider = async (providerId: string) => {
        try {
            setIsSelecting(true)
            await EmergencyService.clientAcceptProvider(id, providerId)

            // Trigger Notification for Provider
            const provider = responses.find(r => r.provider_id === providerId)?.provider
            if (provider) {
                const { NotificationTriggers } = await import("@/lib/notifications/notification-triggers")
                // Fetch client name (current user)
                const { data: { user } } = await supabase.auth.getUser()
                const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id || '').single()

                await NotificationTriggers.triggerEmergencyResponseAccepted(
                    id,
                    providerId,
                    user?.id || '',
                    profile?.full_name || "Cliente"
                )
            }

            toast({
                title: "Técnico Selecionado!",
                description: "O profissional foi confirmado e está a caminho.",
            })
            fetchRequest()
        } catch (err) {
            console.error(err)
            toast({ title: "Erro", description: "Falha ao selecionar técnico.", variant: "destructive" })
        } finally {
            setIsSelecting(false)
        }
    }

    const handleCancelEmergency = async () => {
        if (!confirm("Tem certeza que deseja cancelar este pedido de emergência?")) return

        try {
            setIsCancelling(true)
            await EmergencyService.cancelEmergency(id)
            toast({
                title: "Emergência Cancelada",
                description: "O seu pedido foi encerrado com sucesso."
            })
            router.push('/dashboard/emergency')
        } catch (err) {
            toast({ title: "Erro", description: "Falha ao cancelar emergência.", variant: "destructive" })
        } finally {
            setIsCancelling(false)
        }
    }

    const handleOpenChat = async (providerId: string) => {
        try {
            const { data, error } = await EmergencyService.getOrCreateConversation(id, request!.client_id, providerId)
            if (error) throw error
            if (data) {
                setConversationId(data.id)
                setChatOpen(true)
            }
        } catch (err) {
            console.error("Error opening chat:", err)
            toast({ title: "Erro", description: "Não foi possível abrir o chat.", variant: "destructive" })
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-red-600" />
            <p className="text-gray-600 animate-pulse text-lg font-medium">A conectar à rede de emergência...</p>
        </div>
    )

    if (!request) return <div>Pedido não encontrado</div>

    const mapMarkers = [
        ...onlineProviders.map(p => ({
            id: p.id,
            lat: p.last_lat,
            lng: p.last_lng,
            type: 'online' as const,
            label: p.full_name
        })),
        ...responses.map(r => ({
            id: r.provider_id,
            lat: r.provider?.last_lat,
            lng: r.provider?.last_lng,
            type: 'responder' as const,
            label: r.provider?.full_name
        }))
    ].filter(m => m.lat && m.lng)

    const isAccepted = request.status === 'accepted' || request.status === 'in_progress'

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8">
            <div className="flex items-center justify-between py-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="rounded-full">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
                            TRACKING <span className="text-red-600">LIVE</span>
                            <Badge variant="destructive" className="ml-2 animate-pulse bg-red-600">ATIVO</Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">{request.category}</p>
                    </div>
                </div>

                {!isAccepted && request.status !== 'cancelled' && (
                    <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 font-bold"
                        onClick={handleCancelEmergency}
                        disabled={isCancelling}
                    >
                        {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                        CANCELAR EMERGÊNCIA
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
                {/* Map View */}
                <div className="lg:col-span-8 space-y-4">
                    <Card className="h-[500px] border-none shadow-2xl overflow-hidden rounded-3xl relative">
                        <EmergencyMap
                            clientLat={request.lat}
                            clientLng={request.lng}
                            providers={mapMarkers}
                            apiKey={GOOGLE_MAPS_API_KEY}
                        />

                        {/* Overlay Status */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
                            <Badge className="bg-white/90 backdrop-blur text-gray-900 border-none px-4 py-2 shadow-lg text-sm font-bold flex gap-2 items-center">
                                <MapPin className="h-4 w-4 text-red-600" />
                                {request.address}
                            </Badge>

                            <Badge className="bg-black/80 backdrop-blur text-white border-none px-4 py-2 shadow-lg text-sm font-bold flex gap-2 items-center">
                                <Users className="h-4 w-4 text-green-400" />
                                {onlineProviders.length} técnicos online
                            </Badge>
                        </div>
                    </Card>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-bold">A sua segurança é a nossa prioridade.</p>
                            <p>O mapa mostra técnicos verificados e disponíveis no momento. Quando um técnico responder, ele aparecerá na lista ao lado.</p>
                        </div>
                    </div>
                </div>

                {/* Responders List */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black italic tracking-tight uppercase">Respostas ({responses.length})</h3>
                        {responses.length > 0 && <Badge className="bg-green-500">{responses.length} Disponíveis</Badge>}
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[700px]">
                        {responses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                    <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
                                </div>
                                <p className="font-bold text-gray-900">A contactar técnicos...</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Enviamos o seu pedido para todos os profissionais qualificados na área.</p>
                            </div>
                        ) : (
                            responses.map((resp) => (
                                <Card
                                    key={resp.id}
                                    className={cn(
                                        "overflow-hidden border-2 transition-all cursor-pointer hover:shadow-xl",
                                        selectedProviderId === resp.provider_id ? "border-red-500 scale-[1.02]" : "border-transparent"
                                    )}
                                    onClick={() => setSelectedProviderId(resp.provider_id)}
                                >
                                    <CardContent className="p-4 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 border-2 border-red-100">
                                                <AvatarImage src={resp.provider?.avatar_url} />
                                                <AvatarFallback className="bg-red-50 text-red-600 font-bold">
                                                    {resp.provider?.full_name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-gray-900 truncate">{resp.provider?.full_name}</h4>
                                                    <div className="flex items-center text-yellow-500 text-xs font-bold">
                                                        <Star className="h-3 w-3 fill-current mr-1" />
                                                        {resp.provider?.rating?.toFixed(1) || 'NEW'}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground italic truncate">{resp.provider?.company_name || "Profissional Independente"}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-gray-50 p-2 rounded-lg text-center">
                                                <p className="text-[10px] uppercase font-bold text-gray-400">Preço / Hora</p>
                                                <p className="text-sm font-black text-gray-900">{resp.quote_details?.price_per_hour}€</p>
                                            </div>
                                            <div className="bg-red-50 p-2 rounded-lg text-center">
                                                <p className="text-[10px] uppercase font-bold text-red-400">Chegada</p>
                                                <p className="text-sm font-black text-red-600">{resp.quote_details?.eta}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1 bg-black text-white hover:bg-gray-800 font-bold text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    // TODO: Open detailed profile/info
                                                }}
                                            >
                                                VER INFO
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-10 w-10 p-0 border-gray-200"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleOpenChat(resp.provider_id)
                                                }}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <Button
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-xl shadow-lg shadow-red-200"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleAcceptProvider(resp.provider_id)
                                            }}
                                            disabled={isSelecting || isAccepted}
                                        >
                                            {isSelecting ? <Loader2 className="animate-spin mr-2" /> : "ACEITAR TÉCNICO"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Accepted View Overlay */}
            {isAccepted && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-6 z-50 animate-in slide-in-from-bottom-full duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-2xl bg-green-50 flex items-center justify-center border-2 border-green-100 animate-pulse">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tight uppercase">Profissional Confirmado!</h3>
                                <p className="text-gray-600 font-medium">O técnico iniciou a jornada e está a caminho.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <Button
                                disabled={!request.provider_id}
                                className="flex-1 md:flex-none h-14 px-8 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl shadow-green-100"
                            >
                                <Phone className="mr-2 h-5 w-5" />
                                LIGAR AGORA
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 md:flex-none h-14 px-8 border-2 border-gray-100 font-black rounded-2xl"
                                onClick={() => request.provider_id && handleOpenChat(request.provider_id)}
                            >
                                <MessageSquare className="mr-2 h-5 w-5" />
                                CHAT
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Sheet */}
            <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                <SheetContent side="right" className="p-0 sm:max-w-[500px] w-full border-l-0">
                    <SheetHeader className="p-6 border-b">
                        <SheetTitle className="text-2xl font-black italic uppercase">Chat de Emergência</SheetTitle>
                    </SheetHeader>
                    {conversationId && request && (
                        <div className="h-[calc(100vh-100px)]">
                            <RealtimeChat
                                conversationId={conversationId}
                                gigTitle={`Emergência: ${request.category}`}
                                otherParticipant={{
                                    id: selectedProviderId || request.provider_id || "",
                                    name: responses.find(r => r.provider_id === (selectedProviderId || request.provider_id))?.provider?.full_name || "Técnico"
                                }}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}

function Users(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
