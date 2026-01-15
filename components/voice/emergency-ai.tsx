"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Mic, MicOff, AlertTriangle, Loader2, MapPin, Send, Crosshair, Search } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { ttsService } from "@/lib/voice/text-to-speech-service"
import { CategorySuggestion } from "@/lib/ai/category-suggestion-service"
import { supabase } from "@/lib/supabase/client"

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
    onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionStatic {
    new(): SpeechRecognition
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic
        webkitSpeechRecognition: SpeechRecognitionStatic
    }
}

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

interface EmergencyAIProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (requestId: string) => void
}

type Step = "chat" | "selection" | "browse" | "broadcasting"

export function EmergencyAI({ isOpen, onClose, onSuccess }: EmergencyAIProps) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [isListening, setIsListening] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [textInput, setTextInput] = useState("")
    const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null)
    const [addressInput, setAddressInput] = useState("")
    const [isLocating, setIsLocating] = useState(false)

    // New State for Selection Flow
    const [step, setStep] = useState<Step>("chat")
    const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([])
    const [allCategories, setAllCategories] = useState<any[]>([])
    const [categorySearch, setCategorySearch] = useState("")

    const recognitionRef = useRef<SpeechRecognition | null>(null)

    // Initialize speech
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition()
                recognitionRef.current.continuous = false
                recognitionRef.current.interimResults = true
                recognitionRef.current.lang = "pt-PT" // Default to Portuguese
            }
        }
    }, [])

    // Initialize Google Maps Autocomplete
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!isOpen || !apiKey) return

        const initAutocomplete = () => {
            const input = document.getElementById("emergency-address-input") as HTMLInputElement
            if (!input || !window.google) return

            const attemptInit = () => {
                if (window.google?.maps?.places?.Autocomplete) {
                    const autocomplete = new window.google.maps.places.Autocomplete(input, {
                        types: ["geocode"],
                    })

                    autocomplete.addListener("place_changed", () => {
                        const place = autocomplete.getPlace()
                        if (place.geometry && place.geometry.location) {
                            const lat = place.geometry.location.lat()
                            const lng = place.geometry.location.lng()
                            const address = place.formatted_address || place.name || ""
                            setLocation({ lat, lng, address })
                            setAddressInput(address)
                        }
                    })
                    return true
                }
                return false
            }

            if (!attemptInit()) {
                const interval = setInterval(() => {
                    if (attemptInit()) clearInterval(interval)
                }, 100)
                setTimeout(() => clearInterval(interval), 5000)
            }
        }

        if (window.google) {
            initAutocomplete()
        } else {
            const scriptId = "google-maps-script"
            if (!document.getElementById(scriptId)) {
                const script = document.createElement("script")
                script.id = scriptId
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&loading=async`
                script.async = true
                script.defer = true
                script.onload = () => initAutocomplete()
                document.head.appendChild(script)
            } else {
                const interval = setInterval(() => {
                    if (window.google) {
                        initAutocomplete()
                        clearInterval(interval)
                    }
                }, 100)
                setTimeout(() => clearInterval(interval), 5000)
            }
        }
    }, [isOpen])

    // Start sequence when opened
    useEffect(() => {
        if (isOpen) {
            setMessages([])
            setTranscript("")
            setTextInput("")
            setStep("chat")
            setSuggestions([])

            const welcome: Message = {
                id: "welcome",
                role: "assistant",
                content: "SERVIÇO DE EMERGÊNCIA. Sou o seu assistente de IA. Qual é o problema? (Ex: cano rebentado, falta de luz...)",
                timestamp: new Date()
            }
            setMessages([welcome])

            // Auto-locate
            handleLocate()

            // Speak welcome
            setTimeout(() => speak(welcome.content), 500)
        }
    }, [isOpen])

    const addMessage = useCallback((role: "user" | "assistant", content: string) => {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const msg: Message = { id: uniqueId, role, content, timestamp: new Date() }
        setMessages(prev => [...prev, msg])
        return msg
    }, [])

    const speak = useCallback((text: string) => {
        ttsService.speak(text, { lang: "pt-PT" })
            .then(() => setIsSpeaking(false))
            .catch(() => setIsSpeaking(false))
        setIsSpeaking(true)
    }, [])

    const handleLocate = async () => {
        setIsLocating(true)
        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject)
            })
            const { latitude, longitude } = pos.coords
            setLocation({ lat: latitude, lng: longitude })

            // Try to reverse geocode
            if (window.google?.maps?.Geocoder) {
                const geocoder = new window.google.maps.Geocoder()
                geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                    if (status === "OK" && results && results[0]) {
                        const address = results[0].formatted_address
                        setAddressInput(address)
                        setLocation(prev => prev ? { ...prev, address } : { lat: latitude, lng: longitude, address })
                    } else {
                        setAddressInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
                    }
                })
            } else {
                setAddressInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
            }
        } catch (err) {
            console.error("Locate error", err)
            toast({ title: "Erro de Localização", description: "Por favor active o GPS ou introduza o endereço manualmente." })
        } finally {
            setIsLocating(false)
        }
    }

    const processInput = async (input: string) => {
        if (!input.trim() || isProcessing) return

        setIsProcessing(true)
        addMessage("user", input)
        setTextInput("")

        try {
            // Call AI for automated matching
            let aiSuggestions: CategorySuggestion[] = []

            try {
                const aiResponse = await fetch("/api/ai/suggest-categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: "Pedido de Emergência",
                        description: input
                    })
                })

                if (aiResponse.ok) {
                    const { suggestions } = await aiResponse.json()
                    aiSuggestions = suggestions || []
                }
            } catch (aiErr) {
                console.error("AI Categorization failed:", aiErr)
            }

            // Keyword fallback if AI is empty
            if (aiSuggestions.length === 0) {
                const lower = input.toLowerCase()
                if (lower.includes("pipe") || lower.includes("water") || lower.includes("plumb") || lower.includes("flood") || lower.includes("leak") ||
                    lower.includes("agua") || lower.includes("água") || lower.includes("cano") || lower.includes("fuga") || lower.includes("inunda") || lower.includes("entup") || lower.includes("vazamento")) {
                    aiSuggestions.push({ id: "plumbing_uuid", name: "Canalização", path: "Canalização", confidence: 0.8 })
                }
                else if (lower.includes("power") || lower.includes("electric") || lower.includes("spark") || lower.includes("short circuit") ||
                    lower.includes("luz") || lower.includes("eletric") || lower.includes("elétric") || lower.includes("disjuntor") || lower.includes("fagulha") || lower.includes("curto") || lower.includes("tomada")) {
                    aiSuggestions.push({ id: "electrical_uuid", name: "Eletricidade", path: "Eletricidade", confidence: 0.8 })
                }
                else if (lower.includes("heating") || lower.includes("cold") || lower.includes("hvac") || lower.includes("boiler") ||
                    lower.includes("aqueciment") || lower.includes("caldeira") || lower.includes("ar condicionado") || lower.includes("frio") || lower.includes("quente")) {
                    aiSuggestions.push({ id: "hvac_uuid", name: "Climatização", path: "Climatização", confidence: 0.8 })
                }
                else if (lower.includes("lock") || lower.includes("key") || lower.includes("door") || lower.includes("outside") ||
                    lower.includes("chave") || lower.includes("porta") || lower.includes("tranc") || lower.includes("fechadura") || lower.includes("fora")) {
                    aiSuggestions.push({ id: "locksmith_uuid", name: "Serralharia", path: "Serralharia", confidence: 0.8 })
                }
            }

            setSuggestions(aiSuggestions)

            const responseText = aiSuggestions.length > 0
                ? `Encontrei algumas categorias. Por favor confirme qual se adequa melhor ao problema.`
                : `Não consegui identificar a categoria. Por favor selecione a partir da lista.`

            addMessage("assistant", responseText)
            speak(responseText)

            // Move to selection step
            setStep("selection")

        } catch (err: any) {
            toast({ title: "Error", description: "Failed to process request.", variant: "destructive" })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleConfirm = async (categoryName: string, serviceId?: string) => {
        setStep("broadcasting")
        const responseText = `Confirmado: ${categoryName}. A contactar técnicos próximos...`
        addMessage("assistant", responseText)
        speak(responseText)

        // Validate UUID to avoid database errors with fallback IDs
        const isValidUUID = (id?: string) => {
            return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        }

        const finalServiceId = isValidUUID(serviceId) ? serviceId : null

        try {
            if (user && location) {
                const response = await fetch("/api/emergency/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: categoryName,
                        serviceId: finalServiceId,
                        description: messages.find(m => m.role === 'user')?.content || "Emergência",
                        lat: location.lat,
                        lng: location.lng,
                        address: location.address || "Localização Atual"
                    })
                })

                if (!response.ok) {
                    const errData = await response.json()
                    console.error("Broadcast Request Failed:", errData)
                    throw new Error(errData.details?.message || errData.error || "Failed to create emergency request")
                }

                const result = await response.json()

                if (result.debugLog) {
                    console.log("🔍 BROADCAST DEBUG LOGS:", result.debugLog)
                }
                if (result.data) {
                    setTimeout(() => {
                        onSuccess(result.data.id)
                        onClose()
                    }, 3000)
                }
            } else if (!location) {
                const locMsg = "Preciso da sua localização. Por favor verifique o GPS."
                addMessage("assistant", locMsg)
                speak(locMsg)
                setStep("chat")
            }
        } catch (err) {
            console.error("Broadcast failed", err)
            toast({ title: "Erro", description: "Falha ao transmitir emergência.", variant: "destructive" })
            setStep("chat")
        }
    }

    const fetchAllCategories = async () => {
        const { data } = await supabase.from("categories").select("*").eq("is_active", true)
        if (data) setAllCategories(data)
    }

    useEffect(() => {
        if (step === "browse" && allCategories.length === 0) {
            fetchAllCategories()
        }
    }, [step])

    const startListening = () => {
        if (!recognitionRef.current) return
        setIsListening(true)
        setTranscript("")

        recognitionRef.current.onresult = (event) => {
            let current = ""
            for (let i = event.resultIndex; i < event.results.length; i++) {
                current += event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    processInput(current)
                    setIsListening(false)
                }
            }
            setTranscript(current)
        }

        recognitionRef.current.onerror = () => setIsListening(false)
        recognitionRef.current.onend = () => setIsListening(false)
        recognitionRef.current.start()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md border-red-200 bg-red-50/30 backdrop-blur-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-6 w-6 animate-bounce" />
                        ASSISTENTE DE EMERGÊNCIA
                    </DialogTitle>
                    <DialogDescription>
                        Fale connosco para obter ajuda imediata.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4 h-[450px]">
                    {step === "browse" ? (
                        <div className="flex-1 flex flex-col gap-2 bg-white rounded-xl p-4 border border-red-100 shadow-inner overflow-hidden">
                            <div className="flex items-center gap-2 mb-2">
                                <Button variant="ghost" size="sm" onClick={() => setStep("selection")} className="-ml-2">
                                    ← Voltar
                                </Button>
                                <Input
                                    placeholder="Procurar categoria..."
                                    value={categorySearch}
                                    onChange={e => setCategorySearch(e.target.value)}
                                    autoFocus
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {allCategories
                                    .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                    .map(cat => (
                                        <Button
                                            key={cat.id}
                                            variant="outline"
                                            className="w-full justify-start text-left h-auto py-3"
                                            onClick={() => handleConfirm(cat.name, cat.id)}
                                        >
                                            <span className="font-semibold">{cat.name}</span>
                                        </Button>
                                    ))}
                                {allCategories.length === 0 && <div className="text-center p-4"><Loader2 className="mx-auto animate-spin" /></div>}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-3 min-h-0">
                            <div className="flex-1 overflow-y-auto bg-white/80 rounded-xl p-4 border border-red-100 shadow-inner flex flex-col gap-3">
                                {messages.map((m) => (
                                    <div key={m.id} className={cn(
                                        "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm animate-in fade-in slide-in-from-bottom-2",
                                        m.role === 'user' ? "bg-red-600 text-white self-end rounded-tr-none" : "bg-gray-100 text-gray-800 self-start rounded-tl-none border border-gray-200"
                                    )}>
                                        {m.content}
                                    </div>
                                ))}

                                {step === "selection" && (
                                    <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-bottom-4 bg-white p-2 rounded-lg border border-gray-100">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Sugestões (Toque para confirmar):</div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {suggestions.map((s) => (
                                                <Button
                                                    key={s.id}
                                                    variant="outline"
                                                    className="justify-between h-auto py-3 border-red-200 hover:bg-red-50 hover:border-red-300 group transition-colors"
                                                    onClick={() => handleConfirm(s.path.split("→").pop()?.trim() || s.name, s.id)}
                                                >
                                                    <div className="flex flex-col items-start text-left">
                                                        <span className="font-semibold text-gray-900 group-hover:text-red-700">{s.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[200px]">{s.path}</span>
                                                    </div>
                                                    {s.confidence > 0.8 && <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none ml-2">Melhor Opção</Badge>}
                                                </Button>
                                            ))}
                                            <Button
                                                variant="ghost"
                                                className="justify-start text-muted-foreground hover:text-foreground"
                                                onClick={() => setStep("browse")}
                                            >
                                                <Search className="mr-2 h-4 w-4" />
                                                Procurar na lista completa...
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {transcript && (
                                    <div className="bg-red-50 text-red-700 self-end rounded-2xl px-4 py-2 text-sm italic animate-pulse">
                                        {transcript}...
                                    </div>
                                )}
                                {isProcessing && (
                                    <div className="self-start flex items-center gap-2 text-gray-400 text-xs italic ml-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        {step === "broadcasting" ? "A contactar técnicos..." : "A analisar pedido..."}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
                            <MapPin className={cn("h-4 w-4", location ? "text-red-500" : "text-gray-300")} />
                            {isLocating ? "A determinar localização..." : "Localização da Emergência:"}
                        </div>
                        <div className="relative group">
                            <Input
                                id="emergency-address-input"
                                placeholder="A detetar endereço..."
                                value={addressInput}
                                onChange={(e) => setAddressInput(e.target.value)}
                                className="pl-3 pr-10 h-10 rounded-xl border-red-100 bg-white/50 focus:bg-white text-sm transition-colors"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg"
                                onClick={handleLocate}
                                disabled={isLocating}
                            >
                                {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {step === "chat" && (
                        <div className="flex flex-col gap-3">
                            <Button
                                size="lg"
                                className={cn(
                                    "h-20 rounded-2xl text-xl font-bold transition-all duration-300 shadow-lg",
                                    isListening ? "bg-red-500 animate-pulse scale-95 ring-4 ring-red-200" : "bg-red-600 hover:bg-red-700 shadow-red-200"
                                )}
                                onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                                disabled={isProcessing}
                            >
                                {isListening ? <MicOff className="mr-3 h-8 w-8" /> : <Mic className="mr-3 h-8 w-8" />}
                                {isListening ? "A OUVIR..." : "FALAR AGORA"}
                            </Button>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ou escreva aqui..."
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && processInput(textInput)}
                                    className="rounded-xl border-red-100 focus:ring-red-500 h-12"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-xl border-red-200 text-red-600 h-12 w-12 hover:bg-red-50"
                                    onClick={() => processInput(textInput)}
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}
