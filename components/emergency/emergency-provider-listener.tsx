"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AlertTriangle, MapPin, Loader2 } from "lucide-react"

export function EmergencyProviderListener() {
    const { user, profile } = useAuth()
    const router = useRouter()
    const [alert, setAlert] = useState<any | null>(null)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        // Only run for online providers
        if (!user || profile?.role !== 'provider' || !profile?.is_online) return

        console.log("📡 Emergency Listener Active for Provider:", user.id)

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
                    if (notif.title?.includes("EMERGENCY") || notif.type === 'error') {
                        // It's an emergency!
                        console.log("🚨 EMERGENCY ALERT RECEIVED:", notif)

                        // Play Sound (Speech)
                        if ('speechSynthesis' in window) {
                            const utterance = new SpeechSynthesisUtterance("Attention! New Emergency Request Nearby!")
                            utterance.rate = 1.1
                            utterance.pitch = 1.2
                            utterance.volume = 1.0
                            window.speechSynthesis.speak(utterance)
                        }

                        // Show Popup
                        setAlert(notif)
                        setOpen(true)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, profile?.role, profile?.is_online])

    const handleView = () => {
        if (alert?.action_url) {
            setOpen(false)
            router.push(alert.action_url)
        }
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
