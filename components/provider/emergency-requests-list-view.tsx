
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, MapPin, Clock, ArrowRight, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface EmergencyRequest {
    id: string
    category: string
    description: string
    status: string
    address: string
    created_at: string
    provider_id?: string
}

export function EmergencyRequestsListView() {
    const router = useRouter()
    const { profile } = useAuth()
    const supabase = createClient()
    const [requests, setRequests] = useState<EmergencyRequest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEmergencies()

        const channel = supabase
            .channel("emergencies_management")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "emergency_requests"
                },
                () => {
                    fetchEmergencies()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchEmergencies = async () => {
        try {
            setLoading(true)
            if (!profile?.id) return

            // 1. Fetch all requests
            const { data: allRequests, error: reqError } = await supabase
                .from("emergency_requests")
                .select("*")
                .order("created_at", { ascending: false })

            if (reqError) throw reqError

            // 2. Fetch my responses to check for rejections
            const { data: myResponses, error: resError } = await supabase
                .from("emergency_responses")
                .select("emergency_id, status")
                .eq("provider_id", profile.id)

            if (resError) throw resError

            // Filter logic
            const currentRequests = (allRequests || []) as EmergencyRequest[]

            // Map responses for easy lookup
            const responseMap = new Map(myResponses?.map(r => [r.emergency_id, r.status]))

            setRequests(currentRequests.map(r => ({
                ...r,
                my_response_status: responseMap.get(r.id)
            })))

        } catch (err) {
            console.error("Error fetching emergencies:", err)
        } finally {
            setLoading(false)
        }
    }

    // NEW FILTER LOGIC:
    // 1- "Novos Pedidos" - to show new active solicitations (pending)
    const newRequests = requests.filter(r => r.status === 'pending')

    // 2- "Ativas" - Accepted active emergencies (assigned to me)
    const activeRequests = requests.filter(r =>
        (r.status === 'accepted' || r.status === 'in_progress') && r.provider_id === profile?.id
    )

    // 3- "Recusadas" - solicitations not accepted by provider (my response was rejected OR client accepted someone else)
    const refusedRequests = requests.filter(r =>
        // I responded but was rejected
        (r.my_response_status === 'rejected') ||
        // It's no longer pending, not my job, and I HAD a response there
        (r.status !== 'pending' && r.provider_id !== profile?.id && r.my_response_status) ||
        // Explicitly cancelled after I was involved
        (r.status === 'cancelled' && r.my_response_status)
    )

    // 4- "Concluidas" - Solicitations already Concluded by Provider
    const concludedRequests = requests.filter(r => r.status === 'completed' && r.provider_id === profile?.id)

    const RequestCard = ({ req, isInactive }: { req: EmergencyRequest, isInactive?: boolean }) => (
        <Card
            key={req.id}
            className={cn(
                "overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-red-100",
                isInactive && "opacity-60 grayscale-[0.5]"
            )}
            onClick={() => router.push(`/dashboard/provider/emergency/${req.id}`)}
        >
            <CardHeader className={cn("bg-red-50/50 pb-3", isInactive && "bg-gray-100")}>
                <div className="flex justify-between items-start">
                    <Badge variant={isInactive ? "secondary" : "destructive"} className={cn(!isInactive && "bg-red-600 font-bold")}>
                        {isInactive ? "INATIVA" : (req.status === 'in_progress' ? "EM CURSO" : "URGENTE")}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <CardTitle className="text-xl mt-2">{req.category}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">{req.description || "Sem descrição adicional."}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span className="truncate">{req.address}</span>
                </div>

                {isInactive ? (
                    <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg text-xs font-medium text-gray-500 italic">
                        <AlertTriangle className="h-3 w-3" />
                        Outro profissional selecionado para esta emergência.
                    </div>
                ) : (
                    <Button
                        className={cn(
                            "w-full font-bold",
                            req.status === 'in_progress' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/provider/emergency/${req.id}`);
                        }}
                    >
                        {req.status === 'in_progress' ? "VER DETALHES / TRACKING" : "VER DETALHES"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </CardContent>
        </Card>
    )

    if (loading && requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-red-600 mb-4" />
                <p className="text-muted-foreground">A procurar pedidos de emergência...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-4xl font-black tracking-tighter italic uppercase text-gray-900">Gestão de Emergências</h2>
                <p className="text-muted-foreground font-medium">Controle os seus serviços urgentes e visualize novas oportunidades.</p>
            </div>

            <Tabs defaultValue="new" className="w-full">
                <TabsList className="bg-gray-100 p-1 rounded-xl h-auto flex-wrap mb-6">
                    <TabsTrigger value="new" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold uppercase text-xs tracking-wider">
                        Novos Pedidos ({newRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="active" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold uppercase text-xs tracking-wider">
                        Ativas ({activeRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="refused" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold uppercase text-xs tracking-wider">
                        Recusadas ({refusedRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="concluded" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold uppercase text-xs tracking-wider">
                        Concluídas ({concludedRequests.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="mt-0">
                    {newRequests.length === 0 ? (
                        <EmptyState message="Sem novos pedidos no momento." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {newRequests.map(req => <RequestCard key={req.id} req={req} />)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="active" className="mt-0">
                    {activeRequests.length === 0 ? (
                        <EmptyState message="Não tem emergências ativas." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeRequests.map(req => <RequestCard key={req.id} req={req} />)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="refused" className="mt-0">
                    {refusedRequests.length === 0 ? (
                        <EmptyState message="Nenhuma solicitação recusada." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                            {refusedRequests.map(req => <RequestCard key={req.id} req={req} isInactive />)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="concluded" className="mt-0">
                    {concludedRequests.length === 0 ? (
                        <EmptyState message="Ainda não concluiu serviços de emergência." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {concludedRequests.map(req => <RequestCard key={req.id} req={req} />)}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <CardTitle className="text-lg">{message}</CardTitle>
                <CardDescription>
                    Novos pedidos aparecerão em tempo real. Continue disponível!
                </CardDescription>
            </CardContent>
        </Card>
    )
}
