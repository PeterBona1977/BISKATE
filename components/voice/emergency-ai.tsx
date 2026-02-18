"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Mic, MicOff, AlertTriangle, Loader2, MapPin, Send, Crosshair, Search, StopCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { ttsService } from "@/lib/voice/text-to-speech-service"
import { supabase } from "@/lib/supabase/client"

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

type Step = "chat" | "confirmation" | "broadcasting"

export function EmergencyAI({ isOpen, onClose, onSuccess }: EmergencyAIProps) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [isListening, setIsListening] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [audioLevel, setAudioLevel] = useState(0)
    const [transcript, setTranscript] = useState("")
    const [textInput, setTextInput] = useState("")
    const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null)
    const [addressInput, setAddressInput] = useState("")
    const [isLocating, setIsLocating] = useState(false)
    const [detectedCategory, setDetectedCategory] = useState<{ id: string; name: string; confidence?: number } | null>(null)
    const [step, setStep] = useState<Step>("chat")

    const [debugLogs, setDebugLogs] = useState<string[]>([])

    // Refs
    // Use HTMLDivElement for generic div, or specific if needed. The error 'scrollRef is not defined' is the priority.
    // Also adding recognitionRef since it's used in startListening.
    const scrollRef = useRef<HTMLDivElement>(null)
    const recognitionRef = useRef<any>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    const addDebugLog = (msg: string) => {
        setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10))
    }

    // Scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, transcript])

    // ... (rest of effects)

    const startListening = async () => {
        addDebugLog("startListening() chamada!")
        addDebugLog(`UA: ${navigator.userAgent.substring(0, 50)}...`)

        // 1. Initial Check and cleanup
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            addDebugLog("ERRO: SpeechRecognition NÃO disponível neste browser!")
            toast({
                title: "Voz Indisponível",
                description: "O seu browser não suporta reconhecimento de voz. Tente Chrome ou Edge.",
                variant: "destructive"
            })
            return
        }

        // Stop assistant from talking
        ttsService.stop()

        // Safety cleanup for previous runs
        stopListening()

        // 2. Request microphone and setup Visualizer
        try {
            addDebugLog("Solicitando microfone...")
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            const activeMic = stream.getAudioTracks()[0]?.label || "Desconhecido"
            const settings = stream.getAudioTracks()[0]?.getSettings()

            addDebugLog(`Mic: ${activeMic.substring(0, 30)}...`)
            addDebugLog(`Hz: ${settings?.sampleRate || '?'}, Ch: ${settings?.channelCount || '?'}`)
            streamRef.current = stream

            // Setup real-time audio level monitoring
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 44100 // Force match with constraints
            })
            addDebugLog(`AudioCtx: ${audioCtx.state} @ ${audioCtx.sampleRate}Hz`)

            if (audioCtx.state === 'suspended') {
                await audioCtx.resume()
            }

            const analyser = audioCtx.createAnalyser()
            const source = audioCtx.createMediaStreamSource(stream)
            source.connect(analyser)
            sourceRef.current = source
            analyser.fftSize = 256

            audioContextRef.current = audioCtx
            analyserRef.current = analyser

            const dataArray = new Uint8Array(analyser.frequencyBinCount)
            let hasReportedSignal = false
            let reportSilenceTimer: NodeJS.Timeout | null = null

            const updateLevel = () => {
                if (!analyserRef.current) return
                analyserRef.current.getByteFrequencyData(dataArray)
                let sum = 0
                let max = 0
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i]
                    if (dataArray[i] > max) max = dataArray[i]
                }
                const average = sum / dataArray.length

                // Nuclear logging: report any signal > 1 to see if it's "almost" working
                if (average > 1 && !hasReportedSignal) {
                    addDebugLog(`Sinal: Avg=${average.toFixed(1)}, Max=${max}`)
                    if (average > 5) hasReportedSignal = true
                }

                setAudioLevel(average / 128)
                animationFrameRef.current = requestAnimationFrame(updateLevel)
            }
            updateLevel()
            addDebugLog("Visualizador ativo")

            // Atomic silence detection
            reportSilenceTimer = setTimeout(() => {
                if (!hasReportedSignal && isListening) {
                    addDebugLog("AVISO: Silêncio total detetado.")
                    addDebugLog("DICA: Tente recarregar a página (F5).")
                }
            }, 4000)

        } catch (err) {
            console.error("Mic error:", err)
            addDebugLog(`Erro Mic: ${err}`)
            toast({
                title: "Microfone indisponível",
                description: "Verifique se deu permissão de microfone.",
                variant: "destructive"
            })
            return
        }

        // 3. Configure Recognition
        const recognition = new SpeechRecognition()
        recognitionRef.current = recognition

        // Continuous: false is safer for debugging and ensures 'onend' fires quickly
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = "pt-PT"

        setIsListening(true)
        setTranscript("")

        // 4. Event Handlers
        recognition.onstart = () => {
            addDebugLog("Evento: onstart (Motor ativo)")
        }

        recognition.onaudiostart = () => {
            addDebugLog("Evento: onaudiostart")
        }

        recognition.onsoundstart = () => {
            addDebugLog("Evento: onsoundstart (Som detetado)")
        }

        recognition.onspeechstart = () => {
            addDebugLog("Evento: onspeechstart (Fala detetada)")
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let current = ""
            for (let i = event.resultIndex; i < event.results.length; i++) {
                current += event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    addDebugLog(`Final: ${current}`)
                    processInput(current)
                    // In continuous mode, we might want to stop after first final command
                    // but for emergency chat, keeping it open might be better.
                    // For now, let's stop listening after a final result to behave like a walkie-talkie.
                    stopListening()
                }
            }
            setTranscript(current)
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            // Ignore 'aborted' as it's usually a result of calling stopListening()
            if (event.error === 'aborted') return

            addDebugLog(`Erro Speech: ${event.error}`)
            if (event.error !== "no-speech") {
                toast({
                    title: "Erro de voz",
                    description: `Erro: ${event.error}`,
                    variant: "destructive"
                })
            }
            stopListening()
        }

        recognition.onnomatch = () => {
            addDebugLog("Evento: onnomatch")
        }

        recognition.onend = () => {
            addDebugLog("Evento: onend")
            const wasEmpty = !transcript && !isProcessing
            setIsListening(false)
            if (wasEmpty) stopListening()
        }

        try {
            recognition.start()
            addDebugLog("Reconhecimento iniciado!")
        } catch (e) {
            addDebugLog(`Exceção: ${e}`)
            stopListening()
        }
    }

    // Monitor speaking state
    useEffect(() => {
        const checkSpeaking = setInterval(() => {
            setIsSpeaking(ttsService.isSpeaking())
        }, 100)
        return () => clearInterval(checkSpeaking)
    }, [])


    // Google Maps Autocomplete removed to prevent input blocking issues.
    // Manual entry is prioritized if Geolocation fails.
    /*
    useEffect(() => {
        // ... legacy autocomplete code removed ...
    }, [isOpen])
    */
    // Start sequence when opened
    useEffect(() => {
        if (isOpen) {
            resetState()
            const welcomeMsg = "Sou o seu assistente de emergência. Diga-me, qual é a situação?"
            addMessage("assistant", welcomeMsg)

            // Auto-locate
            handleLocate()

            // Speak welcome with new Neural Voice
            setTimeout(() => speak(welcomeMsg), 500)
        } else {
            stopAllAudio()
        }
    }, [isOpen])

    const resetState = () => {
        setMessages([])
        setTranscript("")
        setTextInput("")
        setStep("chat")
        setDetectedCategory(null)
        stopAllAudio()
    }

    const stopAllAudio = () => {
        ttsService.stop()

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop()
            } catch (e) { /* ignore */ }
            recognitionRef.current = null
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }

        setIsListening(false)
        setIsSpeaking(false)
    }

    const addMessage = useCallback((role: "user" | "assistant", content: string) => {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const msg: Message = { id: uniqueId, role, content, timestamp: new Date() }
        setMessages(prev => [...prev, msg])
        return msg
    }, [])

    const speak = useCallback((text: string) => {
        setIsSpeaking(true)
        // Using "forceBrowser: false" to use the new Google Cloud Neural2 voice
        ttsService.speak(text, { lang: "pt-PT", forceBrowser: false })
            .catch((err) => {
                console.error("Speech error", err)
                setIsSpeaking(false)
            })
    }, [])

    const handleLocate = async (retryCount = 0) => {
        if (retryCount === 0) {
            setIsLocating(true)
            if (!addressInput || addressInput === "A detetar endereço...") {
                setAddressInput("A obter localização...")
            }
        }

        try {
            if (!navigator.geolocation) {
                throw new Error("Geolocalização não suportada")
            }

            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                })
            })

            const { latitude, longitude } = pos.coords
            console.log("📍 GPS Coordinates:", latitude, longitude)

            // Initial fallback
            setLocation({ lat: latitude, lng: longitude })

            // Use the reliable API Route for Geocoding (bypasses browser CORS and 405 Server Action issues)
            try {
                const response = await fetch("/api/geo", {
                    method: "POST",
                    body: JSON.stringify({ lat: latitude, lng: longitude }),
                    headers: { "Content-Type": "application/json" }
                })
                const data = await response.json()

                if (data && data.address) {
                    console.log("✅ Geocoded address via API Route:", data.address)
                    setAddressInput(data.address)
                    setLocation({ lat: latitude, lng: longitude, address: data.address })
                } else {
                    console.warn("⚠️ Geocoding returned no address:", data?.error)
                    setAddressInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
                }
            } catch (err) {
                console.error("❌ Geocoding API Route error:", err)
                setAddressInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
            }

        } catch (err: any) {
            console.error("Locate error:", err)
            if (!addressInput) {
                let errorMsg = "Localização indisponível"
                if (err.code === 1) errorMsg = "Permissão negada"
                setAddressInput(errorMsg)
            }
            toast({
                title: "Localização",
                description: "Não foi possível usar o GPS. Por favor digite a morada.",
                variant: "destructive"
            })
        } finally {
            setIsLocating(false)
        }
    }

    // Forward Geocoding: When user types an address manually
    const handleManualAddressBlur = async () => {
        if (!addressInput || addressInput.includes(",")) return // Skip if looks like coords

        setIsLocating(true)
        try {
            const response = await fetch("/api/geo", {
                method: "POST",
                body: JSON.stringify({ address: addressInput }),
                headers: { "Content-Type": "application/json" }
            })
            const data = await response.json()

            if (data && data.lat && data.lng) {
                setLocation({ lat: data.lat, lng: data.lng, address: data.address })
                console.log("📍 Forward geocoded via API Route:", data.address)
            } else {
                console.warn("Forward geocoding returned no result:", data?.error)
            }
        } catch (error) {
            console.error("Forward geocoding error:", error)
        } finally {
            setIsLocating(false)
        }
    }

    const processInput = async (input: string) => {
        if (!input.trim() || isProcessing) return

        // Stop any current speech when user replies
        ttsService.stop()

        setIsProcessing(true)
        const userMsg = addMessage("user", input)
        setTextInput("")

        try {
            // Send entire history to the new Chat API
            const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

            const response = await fetch("/api/ai/emergency-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: history,
                    location: addressInput || "Desconhecida"
                })
            })

            if (!response.ok) {
                let errorData
                try {
                    errorData = await response.json()
                } catch (e) {
                    errorData = { error: response.statusText }
                }
                throw new Error(errorData.error || errorData.details || `Server Error ${response.status}`)
            }

            const data = await response.json()

            // 1. Add Assistant Response
            if (data.assistantResponse) {
                addMessage("assistant", data.assistantResponse)
                speak(data.assistantResponse)
            }

            // 2. Check for Category Detection
            if (data.detectedCategory && data.detectedCategory.confidence > 0.8) {
                setDetectedCategory(data.detectedCategory)
                setStep("confirmation")
            }

        } catch (err: any) {
            console.error("Chat Error:", err)
            // Show actual error to help debugging
            const errorMessage = err.message || "Unknown Error"
            const userFriendlyError = `Erro de Conexão (${errorMessage}). Por favor tente novamente.`

            addMessage("assistant", userFriendlyError)
            speak("Ocorreu um erro técnico. Por favor verifique a sua conexão.")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleConfirmCategory = async () => {
        if (!detectedCategory) return
        setStep("broadcasting")
        const confirmMsg = `Entendido. A contactar especialistas em ${detectedCategory.name} agora mesmo.`
        addMessage("assistant", confirmMsg)
        speak(confirmMsg)

        try {
            if (user && location) {
                const response = await fetch("/api/emergency/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: detectedCategory.name,
                        serviceId: detectedCategory.id,
                        description: messages.map(m => m.content).join("\n"), // Full transcript as description
                        lat: location.lat,
                        lng: location.lng,
                        address: location.address || "Localização Atual"
                    })
                })

                if (!response.ok) throw new Error("Broadcast failed")
                const result = await response.json()

                if (result.data) {
                    setTimeout(() => {
                        onSuccess(result.data.id)
                        onClose()
                    }, 4000) // Wait a bit for audio to finish
                }
            } else {
                throw new Error("Missing location or user")
            }
        } catch (err) {
            console.error("Broadcast failed", err)
            setStep("chat")
            const errorMsg = "Falha ao criar o pedido. Por favor tente novamente."
            addMessage("assistant", errorMsg)
            speak(errorMsg)
        }
    }



    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                // Remove listeners first to avoid 'aborted' error loops
                recognitionRef.current.onresult = null
                recognitionRef.current.onerror = null
                recognitionRef.current.onend = null
                recognitionRef.current.abort()
            } catch (e) { /* ignore */ }
            recognitionRef.current = null
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect()
            sourceRef.current = null
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => { })
            audioContextRef.current = null
        }

        analyserRef.current = null

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }

        setIsListening(false)
        setAudioLevel(0)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) stopAllAudio(); onClose(); }}>
            <DialogContent className="sm:max-w-md border-red-200 bg-red-50/30 backdrop-blur-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-6 w-6 animate-pulse" />
                        ASSISTENTE DE EMERGÊNCIA
                    </DialogTitle>
                    <DialogDescription>
                        {detectedCategory ? `Emergência Detetada: ${detectedCategory.name}` : "Descreva a situação. Estou aqui para ajudar."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4 h-[500px]">
                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col gap-3 min-h-0">
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto bg-white/80 rounded-xl p-4 border border-red-100 shadow-inner flex flex-col gap-3 scroll-smooth"
                        >
                            {messages.map((m) => (
                                <div key={m.id} className={cn(
                                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm animate-in fade-in slide-in-from-bottom-2",
                                    m.role === 'user' ? "bg-red-600 text-white self-end rounded-tr-none" : "bg-gray-100 text-gray-800 self-start rounded-tl-none border border-gray-200"
                                )}>
                                    {m.content}
                                </div>
                            ))}

                            {/* Live Transcript Bubble */}
                            {transcript && (
                                <div className="bg-red-50 text-red-700 self-end rounded-2xl px-4 py-2 text-sm italic animate-pulse border border-red-100">
                                    {transcript}...
                                </div>
                            )}

                            {/* Processing Indicator */}
                            {isProcessing && (
                                <div className="self-start flex items-center gap-2 text-gray-500 text-xs italic ml-2 bg-white/50 px-3 py-1 rounded-full">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    A pensar...
                                </div>
                            )}

                            {/* Confirmation Card */}
                            {step === "confirmation" && detectedCategory && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl animate-in zoom-in-95 duration-300">
                                    <h4 className="font-semibold text-red-900 mb-1">Confirmar Categoria?</h4>
                                    <p className="text-sm text-red-700 mb-3">Identificámos isto como uma emergência de <strong>{detectedCategory.name}</strong>.</p>
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md transition-all hover:scale-105"
                                            onClick={handleConfirmCategory}
                                        >
                                            Sim, Chamar Ajuda
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="px-3 border-red-200 hover:bg-red-100"
                                            onClick={() => {
                                                setStep("chat")
                                                setDetectedCategory(null)
                                                addMessage("assistant", "Peço desculpa. Pode descrever melhor o problema?")
                                                speak("Peço desculpa. Pode descrever melhor o problema?")
                                            }}
                                        >
                                            Não
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Location Bar */}
                    {/* Location Bar */}
                    <div className="flex flex-col gap-2 px-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
                            <MapPin className={cn("h-3 w-3", location ? "text-red-500" : "text-gray-300")} />
                            {isLocating ? "A determinar localização..." : "Localização da Emergência:"}
                        </div>

                        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                            <div className="text-[10px] text-red-500 bg-red-50 p-1 rounded mb-1 border border-red-100">
                                ⚠️ Configuração em falta: Chave API Google Maps.
                            </div>
                        )}

                        <div className="relative group">
                            <Input
                                id="emergency-address-input"
                                placeholder={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "Escreva a morada..." : "Insira a morada manualmente..."}
                                value={addressInput}
                                onChange={(e) => setAddressInput(e.target.value)}
                                onBlur={handleManualAddressBlur}
                                className="pl-3 pr-10 h-9 rounded-lg border-red-100 bg-white text-xs text-black"
                                autoComplete="off" // Prevent browser autocomplete fighting with Google
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-red-500 hover:bg-red-50 rounded-md"
                                onClick={() => handleLocate(0)}
                                disabled={isLocating}
                                type="button"
                            >
                                {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crosshair className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>

                    {/* Input Controls */}
                    {step !== "broadcasting" && (
                        <div className="flex flex-col gap-3">
                            <Button
                                size="lg"
                                className={cn(
                                    "h-16 rounded-2xl text-lg font-bold transition-all duration-300 shadow-lg relative overflow-hidden",
                                    isListening ? "bg-red-500 animate-pulse scale-95 ring-4 ring-red-200" :
                                        isSpeaking ? "bg-amber-500 hover:bg-amber-600" : "bg-red-600 hover:bg-red-700 shadow-red-200"
                                )}
                                onClick={isListening ? stopListening : isSpeaking ? () => ttsService.stop() : startListening}
                                disabled={isProcessing}
                                style={{
                                    transform: isListening ? `scale(${1 + Math.min(audioLevel * 0.2, 0.1)})` : 'scale(1)',
                                    boxShadow: isListening ? `0 0 ${audioLevel * 30}px rgba(239, 68, 68, 0.6)` : 'none'
                                }}
                            >
                                {isListening ? (
                                    <>
                                        <MicOff className="mr-2 h-6 w-6" /> A OUVIR...
                                    </>
                                ) : isSpeaking ? (
                                    <>
                                        <StopCircle className="mr-2 h-6 w-6" /> PARAR ÁUDIO
                                    </>
                                ) : (
                                    <>
                                        <Mic className="mr-2 h-6 w-6" /> FALAR AGORA
                                    </>
                                )}
                            </Button>

                            <div className="flex gap-2 p-4 border-t border-red-100 bg-white/50">
                                <Input
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Escreva a sua resposta..."
                                    className="flex-1 bg-white border-red-200 focus-visible:ring-red-500"
                                    onKeyDown={(e) => e.key === "Enter" && processInput(textInput)}
                                    disabled={isProcessing}
                                />
                                <Button
                                    size="icon"
                                    onClick={() => processInput(textInput)}
                                    disabled={!textInput.trim() || isProcessing}
                                    className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant={isListening ? "destructive" : "outline"}
                                    onClick={isListening ? stopListening : startListening}
                                    className={cn(
                                        "shadow-md transition-all duration-300",
                                        isListening ? "animate-pulse ring-2 ring-red-400 ring-offset-2" : "border-red-200 text-red-600 hover:bg-red-50"
                                    )}
                                    disabled={isProcessing}
                                >
                                    {isListening ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                </Button>
                            </div>

                            {/* Área de Debug (Visível apenas se houver logs) */}
                            {debugLogs.length > 0 && (
                                <div className="mx-4 mb-4 p-2 bg-gray-900 text-green-400 rounded text-xs font-mono max-h-32 overflow-y-auto border border-gray-700">
                                    <p className="font-bold text-gray-500 mb-1 border-b border-gray-700 pb-1">Debug Logs:</p>
                                    {debugLogs.map((log, i) => (
                                        <div key={i} className="whitespace-nowrap">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            )}
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
