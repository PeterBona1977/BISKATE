"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Loader2, X } from "lucide-react"
import { ttsService } from "@/lib/voice/text-to-speech-service"

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
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

interface CollectedData {
  title?: string
  description?: string
  category?: string
  price?: number
  location?: string
  estimated_duration?: number
  duration_unit?: string
}

interface AIConversationProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CollectedData) => void
}

export function AIConversation({ isOpen, onClose, onComplete }: AIConversationProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [collectedData, setCollectedData] = useState<CollectedData>({})

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        recognitionRef.current = new SpeechRecognition()

        if (recognitionRef.current) {
          recognitionRef.current.continuous = false
          recognitionRef.current.interimResults = true
          recognitionRef.current.lang = "en-US"
        }
      }

      // Speech synthesis is handled by ttsService
    }
  }, [])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessages([])
      setError(null)
      setTranscript("")
      setCollectedData({})
      stopSpeaking()

      // Add welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "Olá! Sou o assistente do GigHub. Diga-me o que precisa e eu ajudo a preencher os dados. Por exemplo: 'Preciso de um eletricista em Lisboa para trocar uma tomada'",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])

      // Speak welcome message
      setTimeout(() => {
        speak(welcomeMessage.content)
      }, 500)
    }
  }, [isOpen])

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
    return newMessage
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !speechSupported) {
      setError("Speech recognition not supported in this browser")
      return
    }

    setError(null)
    setIsListening(true)
    setTranscript("")

    recognitionRef.current.onstart = () => {
      console.log("🎤 Speech recognition started")
    }

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript + interimTranscript)

      if (finalTranscript) {
        console.log("🎤 Final transcript:", finalTranscript)
        processUserInput(finalTranscript.trim())
      }
    }

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("🎤 Speech recognition error:", event.error)
      setError(`Speech recognition error: ${event.error}`)
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      console.log("🎤 Speech recognition ended")
      setIsListening(false)
    }

    try {
      recognitionRef.current.start()
    } catch (err) {
      console.error("🎤 Failed to start speech recognition:", err)
      setError("Failed to start speech recognition")
      setIsListening(false)
    }
  }, [speechSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

  const speak = useCallback((text: string) => {
    ttsService.speak(text, { lang: "pt-PT" })
      .then(() => setIsSpeaking(false))
      .catch((err) => {
        console.error("🔊 Speech synthesis error:", err)
        setIsSpeaking(false)
      })
    setIsSpeaking(true)
  }, [])

  const stopSpeaking = useCallback(() => {
    ttsService.stop()
    setIsSpeaking(false)
  }, [])

  const processUserInput = useCallback(
    async (input: string) => {
      if (!input.trim()) return

      setIsProcessing(true)
      addMessage("user", input)

      try {
        // Call the real Gemini API
        const response = await fetch("/api/ai/analyze-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: input,
            // chatHistory could be added here if needed for deeper context
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`)
        }

        const data = await response.json()
        const aiMessage = addMessage("assistant", data.response)

        // Update collected data if Gemini extracted anything
        if (data.extractedData) {
          setCollectedData((prev) => ({ ...prev, ...data.extractedData }))
        }

        // Speak the AI response
        speak(data.response)

        // If we have enough data, offer to complete
        const updatedData = { ...collectedData, ...data.extractedData }
        if (updatedData.title && updatedData.description && (updatedData.category || data.analysis?.category)) {
          // If Gemini suggested a category in analysis but not in extractedData, use it
          const finalCategory = updatedData.category || data.analysis?.category
          if (finalCategory && !updatedData.category) {
            setCollectedData(prev => ({ ...prev, category: finalCategory }))
          }

          setTimeout(() => {
            const completeMessage = "Tenho informações suficientes! Quer que eu preencha o formulário automaticamente?"
            addMessage("assistant", completeMessage)
            speak(completeMessage)
          }, 2000)
        }
      } catch (err) {
        console.error("❌ AI processing error:", err)
        const errorMessage = "Desculpe, ocorreu um erro ao processar o seu pedido. Por favor, tente novamente."
        addMessage("assistant", errorMessage)
        speak(errorMessage)
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setIsProcessing(false)
        setTranscript("")
      }
    },
    [addMessage, speak, collectedData],
  )

  const generateMockAIResponse = (input: string): { response: string; extractedData?: CollectedData } => {
    const lowerInput = input.toLowerCase()

    // Extract service type
    let category = ""
    let title = ""
    const description = input
    let location = ""
    let price = undefined
    let estimated_duration = undefined
    let duration_unit = "hours"

    // Category detection
    if (lowerInput.includes("electrician") || lowerInput.includes("electr")) {
      category = "Electrician"
      title = "Electrician Service"
    } else if (lowerInput.includes("plumber") || lowerInput.includes("plumb")) {
      category = "Plumber"
      title = "Plumber Service"
    } else if (lowerInput.includes("cleaning") || lowerInput.includes("clean")) {
      category = "Cleaning"
      title = "Cleaning Service"
    } else if (lowerInput.includes("painting") || lowerInput.includes("paint")) {
      category = "Painting"
      title = "Painting Service"
    } else if (lowerInput.includes("garden") || lowerInput.includes("gardening")) {
      category = "Gardening"
      title = "Gardening Service"
    }

    // Location detection
    const cities = ["lisbon", "porto", "coimbra", "braga", "aveiro", "faro"]
    for (const city of cities) {
      if (lowerInput.includes(city)) {
        location = city.charAt(0).toUpperCase() + city.slice(1)
        break
      }
    }

    // Price detection
    const priceMatch = input.match(/(\d+)\s*\$|\$\s*(\d+)/)
    if (priceMatch) {
      price = Number.parseInt(priceMatch[1] || priceMatch[2])
    }

    // Duration detection
    const durationMatch = input.match(/(\d+)\s*(hour|hours|day|days)/)
    if (durationMatch) {
      estimated_duration = Number.parseInt(durationMatch[1])
      duration_unit = durationMatch[2].includes("day") ? "days" : "hours"
    }

    const extractedData: CollectedData = {}
    if (category) extractedData.category = category
    if (title) extractedData.title = title
    if (description) extractedData.description = description
    if (location) extractedData.location = location
    if (price) extractedData.price = price
    if (estimated_duration) extractedData.estimated_duration = estimated_duration
    if (duration_unit) extractedData.duration_unit = duration_unit

    let response = "Understood! "
    if (category) response += `You need a ${category.toLowerCase()}. `
    if (location) response += `In ${location}. `
    response += "What more details can you give me about the gig?"

    return { response, extractedData }
  }

  const handleComplete = useCallback(() => {
    onComplete(collectedData)
    onClose()
  }, [collectedData, onComplete, onClose])

  const clearConversation = useCallback(() => {
    setMessages([])
    setError(null)
    setTranscript("")
    setCollectedData({})
    stopSpeaking()
  }, [stopSpeaking])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            GigHub Voice Assistant
          </DialogTitle>
          <DialogDescription>
            Use your voice to describe the gig you need. Our AI will help you fill out the details.
          </DialogDescription>
          {!speechSupported && (
            <Badge variant="destructive" className="w-fit">
              Speech recognition not supported
            </Badge>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Messages */}
          <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Current transcript */}
            {transcript && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-blue-100 text-blue-900 border-2 border-blue-200">
                  <p className="text-sm">{transcript}</p>
                  <p className="text-xs opacity-70 mt-1">Speaking...</p>
                </div>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm">Processing...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collected Data Preview */}
          {Object.keys(collectedData).length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Collected Data:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {collectedData.title && (
                  <div>
                    <strong>Title:</strong> {collectedData.title}
                  </div>
                )}
                {collectedData.category && (
                  <div>
                    <strong>Category:</strong> {collectedData.category}
                  </div>
                )}
                {collectedData.location && (
                  <div>
                    <strong>Location:</strong> {collectedData.location}
                  </div>
                )}
                {collectedData.price && (
                  <div>
                    <strong>Price:</strong> ${collectedData.price}
                  </div>
                )}
                {collectedData.estimated_duration && (
                  <div>
                    <strong>Duration:</strong> {collectedData.estimated_duration} {collectedData.duration_unit}
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={!speechSupported || isProcessing}
              variant={isListening ? "destructive" : "default"}
              size="lg"
              className="flex-1 max-w-xs"
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Speak"}
                </>
              )}
            </Button>

            <Button onClick={isSpeaking ? stopSpeaking : undefined} disabled={!isSpeaking} variant="outline" size="lg">
              {isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Audio
                </>
              )}
            </Button>

            {Object.keys(collectedData).length > 0 && (
              <Button onClick={handleComplete} variant="default" size="lg" className="bg-green-600 hover:bg-green-700">
                Fill Out Form
              </Button>
            )}

            {messages.length > 1 && (
              <Button onClick={clearConversation} variant="outline" size="lg">
                Clear
              </Button>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Status indicators */}
          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isListening ? "bg-red-500" : "bg-gray-300"}`} />
              {isListening ? "Listening" : "Stopped"}
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-blue-500" : "bg-gray-300"}`} />
              {isSpeaking ? "Speaking" : "Silent"}
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isProcessing ? "bg-yellow-500" : "bg-gray-300"}`} />
              {isProcessing ? "Processing" : "Ready"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
