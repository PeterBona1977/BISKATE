
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
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { EmergencyChat } from "@/components/emergency/emergency-chat"
import { useEmergencyChat } from "@/contexts/emergency-chat-context"
import { useEmergencyChatListener } from "@/hooks/use-emergency-chat-listener"
import { EmergencyService, EmergencyRequest, EmergencyResponse } from "@/lib/emergency/emergency-service"
import { toast } from "@/hooks/use-toast"
import { EmergencyMap } from "@/components/dashboard/emergency-map"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { EmergencyPaymentModal } from "@/components/emergency/emergency-payment-modal"
import { ProviderProfileSheet } from "@/components/emergency/provider-profile-sheet"
import { CancellationModal } from "@/components/emergency/cancellation-modal"
import { ServiceAssessmentReview } from "@/components/emergency/service-assessment-review"

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
    const [profileResp, setProfileResp] = useState<EmergencyResponse | null>(null)
    const { openChat: openFloatingChat } = useEmergencyChat()

    // Listen for chat_started broadcast from the provider side
    useEmergencyChatListener(
        id,
        `Emergência: ${request?.category || ""}`,
        responses.find(r => r.provider_id === request?.provider_id)?.provider?.full_name || "Técnico"
    )
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [chatOpen, setChatOpen] = useState(false)
    const [pendingPaymentProviderId, setPendingPaymentProviderId] = useState<string | null>(null)
    const [cancelModalOpen, setCancelModalOpen] = useState(false)
    const [assessment, setAssessment] = useState<any | null>(null)
    const [assessmentReviewOpen, setAssessmentReviewOpen] = useState(false)
    const [declineProviderId, setDeclineProviderId] = useState<string | null>(null)
    const [declineReason, setDeclineReason] = useState("")

    useEffect(() => {
        if (id) {
            loadInitialData()

            // 5-minute periodic notification for pending search, AND quick polling for updates
            const pollingInterval = setInterval(() => {
                fetchResponses()
                fetchRequest()
            }, 10000)

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
                        const updated = payload.new as EmergencyRequest
                        setRequest(prev => ({ ...prev, ...updated } as EmergencyRequest))
                        // Auto-fetch assessment when status flips
                        if (updated.status === 'assessment_pending') {
                            // Immediately set state to trigger popup, then fetch details
                            setAssessmentReviewOpen(true)
                            fetch(`/api/emergency/assessment?emergencyId=${id}`)
                                .then(r => r.json())
                                .then(({ assessment: a }) => {
                                    if (a) {
                                        setAssessment(a)
                                    }
                                })
                                .catch(() => { })
                        }
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
                clearInterval(pollingInterval)
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
        if (data) {
            setRequest(data)
            if (data.status === 'assessment_pending') {
                try {
                    const res = await fetch(`/api/emergency/assessment?emergencyId=${id}`)
                    const { assessment: a } = await res.json()
                    if (a) {
                        setAssessment(a)
                        setAssessmentReviewOpen(true)
                    }
                } catch (e) {
                    console.error("Failed to auto-fetch assessment on load", e)
                }
            }
        }
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
        // Trigger Payment Modal instead of immediate acceptance
        setPendingPaymentProviderId(providerId)
    }

    const handlePaymentSuccess = async (providerId: string) => {
        try {
            setIsSelecting(true)
            await EmergencyService.clientAcceptProvider(id, providerId)

            toast({
                title: "Técnico Selecionado!",
                description: "O profissional foi confirmado e está a caminho.",
            })
            fetchRequest()
            setConversationId(null) // Reset chat context just in case
        } catch (err) {
            console.error(err)
            toast({ title: "Erro", description: "Falha ao selecionar técnico.", variant: "destructive" })
        } finally {
            setIsSelecting(false)
            setPendingPaymentProviderId(null)
        }
    }

    const handleDeclineProvider = async () => {
        if (!declineProviderId || !declineReason.trim()) {
            toast({ title: "Atenção", description: "Por favor, indique o motivo da recusa.", variant: "destructive" });
            return;
        }

        const pId = declineProviderId;
        setIsSelecting(true);

        try {
            const { error } = await supabase
                .from("emergency_responses")
                .update({ status: 'rejected', reject_reason: declineReason.trim() })
                .eq('emergency_id', id)
                .eq('provider_id', pId);

            if (error) throw error;

            // Optimistic UI updates
            setResponses(prev => prev.filter(r => r.provider_id !== pId));
            if (selectedProviderId === pId) setSelectedProviderId(null);

            toast({
                title: "Proposta Recusada",
                description: "O técnico foi notificado do motivo e removido da sua lista."
            });

            // Warn if no providers left
            const remaining = responses.filter(r => r.provider_id !== pId);
            if (remaining.length === 0 && onlineProviders.length === 0) {
                toast({
                    title: "Atenção",
                    description: "De momento não temos mais profissionais online. A recomendação é manter a pesquisa ativa.",
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error("Erro ao recusar técnico:", err);
            toast({ title: "Erro", description: "Falha ao recusar a proposta.", variant: "destructive" });
            fetchResponses();
        } finally {
            setIsSelecting(false);
            setDeclineProviderId(null);
            setDeclineReason("");
        }
    }

    const handleCallProvider = () => {
        const acceptedResponse = responses.find(r => r.provider_id === request?.provider_id)
        const phone = acceptedResponse?.provider?.phone
        if (phone) {
            window.location.href = `tel:${phone}`
        } else {
            toast({ title: "Erro", description: "Número de telefone não disponível.", variant: "destructive" })
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
            // Use server-side API route (admin client) to bypass RLS infinite recursion
            const res = await fetch("/api/emergency/conversation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestId: id,
                    clientId: request!.client_id,
                    providerId
                })
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "API error")
            }
            const { conversationId: convId } = await res.json()
            if (convId) {
                setConversationId(convId)
                setChatOpen(true)
                // Also activate persistent floating chat widget
                const provName = responses.find(r => r.provider_id === providerId)?.provider?.full_name || "Técnico"
                openFloatingChat(convId, `Emergência: ${request?.category || ""}`, provName)
            }
        } catch (err: any) {
            console.error("Error opening chat:", err)
            toast({ title: "Erro", description: err.message || "Não foi possível abrir o chat.", variant: "destructive" })
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

    const isAccepted = ['accepted', 'in_progress', 'arrived', 'assessment_pending', 'service_accepted'].includes(request.status)
    const isCompleted = ['completed', 'disputed'].includes(request.status)
    const isAssessmentPending = request.status === 'assessment_pending'
    const providerEnRoute = ['in_progress', 'arrived', 'assessment_pending', 'service_accepted'].includes(request.status)

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8">
            <div className="flex items-center justify-between py-6">
                <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="rounded-full shrink-0">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-3xl font-black tracking-tighter flex items-center gap-2 truncate">
                            TRACKING <span className="text-red-600">LIVE</span>
                            <Badge variant="destructive" className="ml-1 sm:ml-2 animate-pulse bg-red-600 text-[10px] sm:text-xs">ATIVO</Badge>
                        </h1>
                        <p className="text-[10px] sm:text-sm text-muted-foreground uppercase font-bold tracking-widest truncate">{request.category}</p>
                    </div>
                </div>

                {/* Cancel button — show for pending AND accepted-but-not-completed */}
                {!isCompleted && request.status !== 'cancelled' && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 font-bold shrink-0 text-[10px] sm:text-sm"
                        onClick={() => setCancelModalOpen(true)}
                    >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        CANCELAR
                    </Button>
                )}
            </div>

            {/* Arrived Banner */}
            {request.status === 'arrived' && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-green-50 border border-green-200 px-5 py-4">
                    <span className="text-2xl">📍</span>
                    <div>
                        <p className="font-black text-green-800 text-sm">O técnico chegou ao local!</p>
                        <p className="text-xs text-green-700">O profissional está no endereço indicado. Abra a porta ou dirija-se ao local.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
                {/* Map View */}
                <div className="lg:col-span-8 space-y-4">
                    <Card className="h-[300px] sm:h-[500px] border-none shadow-2xl overflow-hidden rounded-2xl sm:rounded-3xl relative">
                        <EmergencyMap
                            clientLat={request.lat}
                            clientLng={request.lng}
                            providers={mapMarkers}
                            apiKey={GOOGLE_MAPS_API_KEY}
                        />

                        {/* Overlay Status */}
                        <div className="absolute top-2 left-2 right-2 flex justify-between pointer-events-none gap-2">
                            <Badge className="bg-white/90 backdrop-blur text-gray-900 border-none px-2 sm:px-4 py-1 sm:py-2 shadow-lg text-[10px] sm:text-sm font-bold flex gap-1 sm:gap-2 items-center truncate max-w-[60%]">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 shrink-0" />
                                <span className="truncate">{request.address}</span>
                            </Badge>

                            <Badge className="bg-black/80 backdrop-blur text-white border-none px-2 sm:px-4 py-1 sm:py-2 shadow-lg text-[10px] sm:text-sm font-bold flex gap-1 sm:gap-2 items-center shrink-0">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                                {onlineProviders.length} <span className="hidden sm:inline">técnicos</span> online
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
                    <div className="flex items-center justify-between mt-4 lg:mt-0">
                        <h3 className="text-xl font-black italic tracking-tight uppercase">Respostas ({responses.length})</h3>
                        {responses.length > 0 && <Badge className="bg-green-500 scale-90 sm:scale-100">{responses.length} Disponíveis</Badge>}
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
                                                <p className="text-[10px] uppercase font-bold text-gray-400">Deslocação / Saída</p>
                                                <p className="text-sm font-black text-gray-900">{resp.quote_details?.travel_fee ?? resp.quote_details?.price_per_hour ?? 45}€</p>
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
                                                    setProfileResp(resp)
                                                }}
                                            >
                                                VER PERFIL
                                            </Button>
                                            {/* Chat only available after payment (isAccepted) and only for selected provider */}
                                            {isAccepted && resp.provider_id === (request?.provider_id || selectedProviderId) && (
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
                                            )}
                                        </div>

                                        {!isAccepted && (
                                            <>
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-tight">
                                                    <strong>Nota Importante:</strong> Este valor cobrirá <strong>apenas a deslocação</strong> e ficará cativo no seu cartão. Não será reembolsado se cancelar após o técnico iniciar viagem. O custo final da reparação será orçamentado no local após análise.
                                                </div>
                                                <div className="flex gap-2 w-full">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold py-6 rounded-xl"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setDeclineProviderId(resp.provider_id)
                                                        }}
                                                        disabled={isSelecting}
                                                    >
                                                        RECUSAR
                                                    </Button>
                                                    <Button
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-6 rounded-xl shadow-lg shadow-green-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleAcceptProvider(resp.provider_id)
                                                        }}
                                                        disabled={isSelecting}
                                                    >
                                                        {isSelecting ? <Loader2 className="animate-spin mr-2" /> : "ACEITAR"}
                                                    </Button>
                                                </div>
                                            </>
                                        )}
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
                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="h-12 w-12 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl bg-green-50 flex items-center justify-center border-2 border-green-100 animate-pulse shrink-0">
                                <CheckCircle2 className="h-6 w-6 sm:h-10 sm:w-10 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg sm:text-2xl font-black italic tracking-tight uppercase leading-tight">
                                    {request.status === 'assessment_pending' ? 'Avaliação Recebida' :
                                        request.status === 'service_accepted' ? 'Reparação em Curso' :
                                            request.status === 'arrived' ? 'Técnico no Local' :
                                                request.status === 'in_progress' ? 'Técnico a Caminho!' :
                                                    'Profissional Confirmado!'}
                                </h3>
                                <p className="text-xs sm:text-gray-600 font-medium">
                                    {request.status === 'assessment_pending' ? 'Verifique o orçamento detalhado.' :
                                        request.status === 'service_accepted' ? 'O técnico está a trabalhar no local.' :
                                            request.status === 'arrived' ? 'Aproxime-se para receber o técnico.' :
                                                request.status === 'in_progress' ? 'O técnico está em viagem para o seu local.' :
                                                    'A aguardar que o técnico inicie o trajeto.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 sm:gap-4 w-full md:w-auto mt-4 md:mt-0">
                            <Button
                                disabled={!request.provider_id}
                                className="flex-1 md:flex-none h-12 sm:h-14 px-4 sm:px-8 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-green-100 text-sm sm:text-base"
                                onClick={handleCallProvider}
                            >
                                <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                LIGAR
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 md:flex-none h-12 sm:h-14 px-4 sm:px-8 border-2 border-gray-100 font-black rounded-xl sm:rounded-2xl text-sm sm:text-base"
                                onClick={() => request.provider_id && handleOpenChat(request.provider_id)}
                            >
                                <MessageSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                CHAT
                            </Button>
                        </div>
                    </div>
                </div>
            )
            }

            {
                isCompleted && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <Card className="max-w-md w-full border-none shadow-2xl rounded-3xl overflow-hidden bg-white animate-in zoom-in-95 duration-500">
                            <div className="bg-green-600 h-2 w-full" />
                            <CardContent className="p-8 text-center space-y-6">
                                <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mx-auto border-4 border-green-100">
                                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black italic tracking-tight uppercase text-gray-900">Serviço Concluído!</h3>
                                    <p className="text-gray-600">A sua emergência foi resolvida com sucesso. Esperamos ter ajudado!</p>
                                </div>
                                <div className="pt-4 space-y-3">
                                    <Button
                                        className="w-full h-14 bg-black text-white hover:bg-gray-800 font-black rounded-2xl"
                                        onClick={() => router.push('/dashboard')}
                                    >
                                        VOLTAR AO DASHBOARD
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 border-2 border-gray-100 font-bold rounded-2xl"
                                        onClick={() => router.push(`/dashboard/emergency/${id}/invoice`)}
                                    >
                                        VER FATURA / DETALHES
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Chat Sheet */}
            <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                <SheetContent side="right" className="p-0 sm:max-w-[500px] w-full border-l-0">
                    <SheetHeader className="p-6 border-b">
                        <SheetTitle className="text-2xl font-black italic uppercase">Chat de Emergência</SheetTitle>
                    </SheetHeader>
                    {conversationId && request && (
                        <div className="h-[calc(100vh-100px)]">
                            <EmergencyChat
                                conversationId={conversationId}
                                title={`Emergência: ${request.category}`}
                                otherParticipantName={responses.find(r => r.provider_id === (selectedProviderId || request.provider_id))?.provider?.full_name || "Técnico"}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <EmergencyPaymentModal
                isOpen={!!pendingPaymentProviderId}
                onClose={() => setPendingPaymentProviderId(null)}
                providerName={responses.find(r => r.provider_id === pendingPaymentProviderId)?.provider?.full_name || "Técnico"}
                amount={(() => {
                    const r = responses.find(resp => resp.provider_id === pendingPaymentProviderId);
                    if (!r || !r.quote_details) return 45;
                    return r.quote_details.travel_fee ?? (r.quote_details.price_per_hour * (r.quote_details.min_hours || 1)) ?? 45;
                })()}
                onSuccess={async () => {
                    if (pendingPaymentProviderId) {
                        await handlePaymentSuccess(pendingPaymentProviderId)
                    }
                }}
            />

            {/* Provider Profile Sheet */}
            <ProviderProfileSheet
                open={!!profileResp}
                onClose={() => setProfileResp(null)}
                provider={profileResp?.provider ?? null}
                quote={profileResp?.quote_details ?? null}
                showContacts={isAccepted}
            />

            {/* Cancellation Modal */}
            <CancellationModal
                open={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                cancelledBy="client"
                providerEnRoute={providerEnRoute}
                onConfirm={async (reason) => {
                    const res = await fetch("/api/emergency/cancel", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ requestId: id, reason, cancelledBy: "client" })
                    })
                    if (!res.ok) throw new Error((await res.json()).error)
                    const { message } = await res.json()
                    toast({ title: "Emergência cancelada", description: message })
                    router.push("/dashboard")
                }}
            />

            {/* Service Assessment Review — auto-opens on assessment_pending */}
            {
                isAssessmentPending && (
                    <div
                        className="fixed bottom-[180px] sm:bottom-[120px] left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-white border border-blue-200 rounded-2xl shadow-2xl p-4 z-[9000] flex items-center gap-4 animate-in slide-in-from-right"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-sm text-blue-800">🔧 Avaliação do Técnico</p>
                            <p className="text-xs text-gray-600 truncate">O técnico analisou o problema e submeteu um orçamento.</p>
                        </div>
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold shrink-0"
                            onClick={() => {
                                if (!assessment) {
                                    fetch(`/api/emergency/assessment?emergencyId=${id}`)
                                        .then(r => r.json())
                                        .then(({ assessment: a }) => { if (a) { setAssessment(a); setAssessmentReviewOpen(true) } })
                                } else {
                                    setAssessmentReviewOpen(true)
                                }
                            }}
                        >
                            Ver Proposta
                        </Button>
                    </div>
                )
            }

            <ServiceAssessmentReview
                open={assessmentReviewOpen}
                assessment={assessment}
                emergencyId={id}
                onClose={() => setAssessmentReviewOpen(false)}
                onResponded={() => {
                    setAssessmentReviewOpen(false)
                    setAssessment(null)
                }}
            />

            {/* Decline Proposal Dialog */}
            <Dialog open={!!declineProviderId} onOpenChange={(open) => !open && setDeclineProviderId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Recusar Proposta</DialogTitle>
                        <DialogDescription>
                            Por favor, indique o motivo da recusa para ajudar este profissional a melhorar e ajustar as suas propostas no futuro.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Ex: O valor de deslocação é muito alto, o tempo de chegada não serve..."
                        value={declineReason}
                        onChange={e => setDeclineReason(e.target.value)}
                        className="mt-4"
                        rows={3}
                    />
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setDeclineProviderId(null)} disabled={isSelecting}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeclineProvider} disabled={isSelecting}>Confirmar Recusa</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
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
