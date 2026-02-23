"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { AlertTriangle, MapPin, Loader2, BellRing } from "lucide-react"

export function EmergencyProviderListener() {
    const { user, profile } = useAuth()
    const [alert, setAlert] = useState<any | null>(null)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Providers often have role='user' but is_provider=true
        const isProvider = profile?.role === 'provider' || profile?.is_provider === true

        if (!user || !isProvider) return

        console.log("📡 Emergency Listener Active for Provider:", user.id)

        // Add a small toast to confirm listener is active (optional, but good for debugging)
        // toast({ title: "Ligação de Emergência Ativa", description: "O seu dispositivo está pronto para receber alertas urgentes." })

        let alarmAudio: HTMLAudioElement | null = null;

        const playAlarm = () => {
            // High-intensity siren sound for reliability
            if (!alarmAudio) {
                alarmAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3")
                alarmAudio.loop = false
            }
            alarmAudio.play().catch(e => console.error("Audio play failed:", e))

            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel()
                const utterance = new SpeechSynthesisUtterance("🚨 ATENÇÃO! NOVO PEDIDO DE EMERGÊNCIA! VERIFIQUE O SEU ECRÃ IMEDIATAMENTE! 🚨")
                utterance.rate = 1.1
                utterance.pitch = 1.0
                utterance.volume = 1.0
                utterance.lang = "pt-PT"
                window.speechSynthesis.speak(utterance)
            }

            // Vibration if supported
            if ('vibrate' in navigator) {
                navigator.vibrate([1000, 500, 1000, 500, 1000])
            }
        }

        const channel = supabase
            .channel(`emergency-alerts-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const notif = payload.new
                    const isEmergency =
                        notif.type === 'emergency' ||
                        notif.title?.toUpperCase().includes("EMERGENCY") ||
                        notif.title?.toUpperCase().includes("EMERGÊNCIA") ||
                        notif.title?.toUpperCase().includes("URGENTE")

                    if (isEmergency) {
                        console.log("🚨 EMERGENCY ALERT RECEIVED IN REALTIME:", notif)

                        // Set state to show modal
                        setAlert(notif)
                        setOpen(true)

                        // Start alarm
                        playAlarm()
                        if (alarmInterval) clearInterval(alarmInterval)
                        alarmInterval = setInterval(playAlarm, 4000) // Repeated siren for urgency

                        toast({
                            title: "🚨 EMERGÊNCIA!",
                            description: notif.message,
                            variant: "destructive",
                            duration: 10000,
                        })
                    }
                }
            )
            .subscribe((status) => {
                console.log(`🔌 Emergency Listener Status:`, status)
            })

        return () => {
            supabase.removeChannel(channel)
            if (alarmInterval) clearInterval(alarmInterval)
            if (alarmAudio) {
                alarmAudio.pause()
                alarmAudio = null
            }
            window.speechSynthesis.cancel()
        }
    }, [user?.id, profile?.is_provider, profile?.role])

    useEffect(() => {
        if (!open) {
            window.speechSynthesis.cancel()
        }
    }, [open])

    const handleView = () => {
        // Notification action_url is stored in the JSONB 'data' column
        const targetUrl = alert?.data?.action_url || alert?.action_url || "/dashboard/provider/emergency"
        setOpen(false)
        router.push(targetUrl)
    }

    if (!alert) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="border-red-500 border-4 shadow-[0_0_50px_rgba(239,68,68,0.5)] sm:max-w-[425px] bg-white">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-red-100 p-3 rounded-full animate-pulse">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black italic uppercase text-red-600 tracking-tighter">
                            EMERGENCY CALL!
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <p className="text-lg font-bold text-gray-900 leading-snug">
                        {alert.message}
                    </p>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Client needs immediate assistance.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)} className="h-12 font-bold">
                        IGNORE
                    </Button>
                    <Button
                        className="h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase flex-1 shadow-lg shadow-red-200 animate-in fade-in zoom-in duration-300"
                        onClick={handleView}
                    >
                        VIEW & RESPOND
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
