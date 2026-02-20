
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, MapPin, Clock, DollarSign, Phone, CheckCircle2, AlertTriangle, ExternalLink, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { EmergencyService } from "@/lib/emergency/emergency-service"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { RealtimeChat } from "@/components/chat/realtime-chat"

interface EmergencyRequest {
    id: string
    category: string
    description: string
    status: string
    lat: number
    lng: number
    address: string
    price_multiplier: number
    created_at: string
    client_id: string
    provider_id?: string
}

export function EmergencyResponseView({ requestId }: { requestId: string }) {
    const router = useRouter()
    const supabase = createClient()
    const [request, setRequest] = useState<EmergencyRequest | null>(null)
    const [loading, setLoading] = useState(true)
    const [isResponding, setIsResponding] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [quote, setQuote] = useState({
        price_per_hour: 45,
        min_hours: 1,
        eta: "20 min"
    })
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [chatOpen, setChatOpen] = useState(false)

    useEffect(() => {
        fetchRequest()
    }, [requestId])

    useEffect(() => {
        fetchRequest()
    }, [requestId])

    const fetchRequest = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("emergency_requests")
                .select("*")
                .eq("id", requestId)
                .single()

            if (error) throw error
            setRequest(data)
        } catch (err: any) {
            console.error("Error fetching emergency:", err)
            setError("Não foi possível carregar os detalhes da emergência.")
        } finally {
            setLoading(false)
        }
    }

    const handleRespond = async () => {
        try {
            setIsResponding(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Não autenticado")

            const { error } = await EmergencyService.respondToEmergency({
                requestId,
                providerId: user.id,
                quote
            })

            if (error) throw error

            toast({
                title: "Resposta Enviada!",
                description: "O cliente foi notificado da sua disponibilidade. Aguarde a confirmação.",
            })

            fetchRequest()
        } catch (err: any) {
            console.error("Error responding to emergency:", err)
            toast({
                title: "Erro",
                description: "Não foi possível enviar a resposta. Tente novamente.",
                variant: "destructive"
            })
        } finally {
            setIsResponding(false)
        }
    }

    const handleOpenChat = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !request) return

            const { data, error } = await EmergencyService.getOrCreateConversation(requestId, request.client_id, user.id)
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

    useEffect(() => {
        // Subscribe to emergency request changes (e.g. if client cancels or accepts another provider)
        const channel = supabase
            .channel(`emergency_${requestId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "emergency_requests",
                    filter: `id=eq.${requestId}`
                },
                (payload) => {
                    setRequest(prev => ({ ...prev, ...payload.new } as EmergencyRequest))
                    if (payload.new.status === 'cancelled') {
                        toast({ title: "Atenção", description: "O cliente cancelou esta emergência.", variant: "destructive" })
                    } else if (payload.new.status === 'accepted') {
                        // In a real app we'd check if it was accepted for US or someone else
                        // here we just refresh to see the new state
                        fetchRequest()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [requestId])

    const handleStartJourney = async () => {
        try {
            setIsResponding(true)
            const { error } = await supabase
                .from("emergency_requests")
                .update({ status: 'in_progress' })
                .eq("id", requestId)

            if (error) throw error

            toast({ title: "Boa viagem!", description: "O cliente foi informado que já está a caminho." })
            fetchRequest()
        } catch (err: any) {
            console.error("Error starting journey:", err)
            toast({ title: "Erro", description: "Falha ao iniciar trajeto.", variant: "destructive" })
        } finally {
            setIsResponding(false)
        }
    }

    const handleComplete = async () => {
        try {
            setIsResponding(true)
            const { error } = await EmergencyService.completeEmergency(requestId)

            if (error) throw error

            toast({ title: "Serviço Concluído!", description: "O cliente foi notificado da conclusão do serviço." })
            fetchRequest()
        } catch (err: any) {
            console.error("Error completing emergency:", err)
            toast({ title: "Erro", description: "Falha ao concluir serviço.", variant: "destructive" })
        } finally {
            setIsResponding(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-red-600" />
                <p className="text-muted-foreground animate-pulse">A carregar detalhes da emergência...</p>
            </div>
        )
    }

    if (error || !request) {
        return (
            <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error || "Emergência não encontrada."}</AlertDescription>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>Voltar</Button>
            </Alert>
        )
    }

    const isPending = request.status === "pending"
    const isAccepted = request.status === "accepted"
    const isInProgress = request.status === "in_progress"
    const isCompleted = request.status === "completed"

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="animate-pulse bg-red-600">EMERGÊNCIA ATIVA</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleString()}</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">{request.category}</h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">{request.description}</p>
                    </div>

                    <Card className="border-none shadow-xl bg-white/40 backdrop-blur-md overflow-hidden outline outline-1 outline-white/20">
                        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50/50 border-b border-red-100">
                            <CardTitle className="text-xl flex items-center gap-2 text-red-800">
                                <MapPin className="h-5 w-5" />
                                Localização e Detalhes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="aspect-[16/9] bg-gray-100 relative group cursor-pointer overflow-hidden border-b border-red-50">
                                {/* Map Placeholder or actual map script could be here */}
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                                    <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                        <MapPin className="h-12 w-12 text-red-600 mx-auto mb-2 drop-shadow-md" />
                                        <p className="font-bold text-gray-800">{request.address}</p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Gps: {request.lat.toFixed(6)}, {request.lng.toFixed(6)}</p>
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4 animate-in fade-in zoom-in duration-700 delay-300">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="shadow-lg hover:bg-white"
                                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${request.lat},${request.lng}`, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Abrir no Google Maps
                                    </Button>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                    <Clock className="h-6 w-6 text-orange-500 mt-1" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 uppercase tracking-tighter">Tempo de Resposta</p>
                                        <p className="text-2xl font-black text-orange-600">IMEDIATO</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                    <DollarSign className="h-6 w-6 text-green-600 mt-1" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 uppercase tracking-tighter">Tarifário</p>
                                        <p className="text-2xl font-black text-green-700">Multiplicador {request.price_multiplier}x</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <Card className={cn(
                        "border-none shadow-2xl transition-all duration-500",
                        isPending ? "bg-white text-gray-900 border border-gray-100" : "bg-green-600 text-white"
                    )}>
                        <CardHeader>
                            <CardTitle className={cn(
                                "text-2xl font-black italic uppercase tracking-widest",
                                isPending ? "text-red-600" : "text-white"
                            )}>
                                {isPending ? "Proposta de Serviço" : "Interesse Enviado"}
                            </CardTitle>
                            <CardDescription className={isPending ? "text-gray-500" : "text-white/80"}>
                                {isPending
                                    ? "Preencha os seus dados para este serviço de urgência."
                                    : "A aguardar seleção do cliente. Pode contactar via chat."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isPending ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Preço / Hora (€)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="number"
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                value={quote.price_per_hour}
                                                onChange={(e) => setQuote(prev => ({ ...prev, price_per_hour: Number(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">Tempo Chegada (ETA)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Ex: 20 min"
                                                value={quote.eta}
                                                onChange={(e) => setQuote(prev => ({ ...prev, eta: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full h-16 text-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-xl hover:scale-[1.02] transition-all active:scale-95 mt-4"
                                        onClick={handleRespond}
                                        disabled={isResponding}
                                    >
                                        {isResponding ? <Loader2 className="animate-spin mr-2" /> : "ENVIAR PROPOSTA"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 text-center">
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-2 animate-pulse">
                                            <CheckCircle2 className="h-10 w-10 text-white" />
                                        </div>
                                        <p className="text-xl font-black uppercase italic">Serviço Confirmado!</p>
                                    </div>

                                    {isAccepted ? (
                                        <Button
                                            className="w-full h-16 text-xl font-bold bg-white text-green-600 hover:bg-gray-100 shadow-xl"
                                            onClick={handleStartJourney}
                                            disabled={isResponding}
                                        >
                                            INICIAR TRAJETO
                                        </Button>
                                    ) : isInProgress ? (
                                        <div className="space-y-4">
                                            <Badge className="w-full py-3 bg-white/20 text-white text-lg font-bold border-none uppercase">
                                                EM TRAJETO...
                                            </Badge>
                                            <Button
                                                className="w-full h-16 text-xl font-bold bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
                                                onClick={handleComplete}
                                                disabled={isResponding}
                                            >
                                                FINALIZAR SERVIÇO
                                            </Button>
                                        </div>
                                    ) : isCompleted ? (
                                        <Badge className="w-full py-3 bg-white/20 text-white text-lg font-bold border-none uppercase">
                                            SERVIÇO CONCLUÍDO
                                        </Badge>
                                    ) : null}

                                    <Button
                                        variant="outline"
                                        className="w-full h-14 bg-transparent border-white/40 text-white hover:bg-white/10"
                                        onClick={handleOpenChat}
                                    >
                                        <MessageSquare className="mr-2 h-5 w-5" />
                                        CHAT COM CLIENTE
                                    </Button>
                                    <div className="flex items-center justify-center gap-2 py-2">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="font-semibold italic">A aguardar chegada</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-dashed border-2 border-red-200 bg-red-50/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase text-red-800">Dicas de Segurança</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-xs space-y-3 text-red-900/70">
                                <li className="flex gap-2"><span>•</span> Use sempre o seu equipamento de segurança (EPI).</li>
                                <li className="flex gap-2"><span>•</span> Confirme a localização exacta com o cliente.</li>
                                <li className="flex gap-2"><span>•</span> Tire fotos do problema à chegada e após a conclusão.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>


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
                                    id: request.client_id,
                                    name: "Cliente" // In a real app we'd fetch the name
                                }}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div >
    )
}
