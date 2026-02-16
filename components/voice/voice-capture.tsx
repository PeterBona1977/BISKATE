"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mic, MicOff, Volume2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Definição de tipo local para SpeechRecognition
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface VoiceCaptureProps {
  onVoiceProcessed: (extractedData: {
    title: string
    description: string
    category: string
    price: number
    location: string
    estimatedTime: string
  }) => void
  isOpen: boolean
  onClose: () => void
}

export function VoiceCapture({ onVoiceProcessed, isOpen, onClose }: VoiceCaptureProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const addDebugLog = (msg: string) => {
    setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10))
  }

  // Referências para o reconhecimento de voz
  const recognitionRef = useRef<any>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const categories = [
    { keywords: ["limpar", "limpeza", "aspirar", "varrer", "esfregar"], category: "Limpeza" },
    { keywords: ["jardim", "jardinagem", "podar", "plantar", "regar", "relva"], category: "Jardinagem" },
    {
      keywords: ["reparar", "consertar", "montar", "armário", "móvel", "estante", "mesa", "cadeira", "ikea"],
      category: "Reparações",
    },
    { keywords: ["transportar", "levar", "buscar", "mudança", "carregar"], category: "Transporte" },
    { keywords: ["cozinhar", "comida", "refeição", "jantar", "almoço"], category: "Cozinha" },
    { keywords: ["computador", "pc", "laptop", "instalar", "configurar", "wifi"], category: "Tecnologia" },
    { keywords: ["cão", "gato", "animal", "passear", "pet", "veterinário"], category: "Animais" },
  ]

  // Inicializar o reconhecimento de voz
  useEffect(() => {
    // Verificar se o navegador suporta a API de reconhecimento de voz
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("O seu navegador não suporta reconhecimento de voz. Tente usar Chrome, Edge ou Safari.")
      return
    }

    // Verificar permissão do microfone
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((status) => {
          setPermissionStatus(status.state)

          status.onchange = () => {
            setPermissionStatus(status.state)
          }
        })
        .catch((err) => {
          console.error("Erro ao verificar permissão:", err)
        })
    }

    // Limpar ao desmontar
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

  const extractDataFromText = (text: string) => {
    // Safety check: ensure text is defined and is a string
    if (!text || typeof text !== 'string') {
      console.warn('extractDataFromText called with invalid text:', text)
      return {
        title: "Serviço solicitado",
        description: "",
        category: "Outros",
        price: 0,
        location: "",
        estimatedTime: "2-3 horas",
      }
    }

    const lowerText = text.toLowerCase()

    // Extrair preço
    const priceMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:euros?|€|eur)/i)
    const price = priceMatch ? Number.parseFloat(priceMatch[1].replace(",", ".")) : 0

    // Extrair localização (procurar por cidades portuguesas comuns e padrões)
    const locationPatterns = [
      /(?:em|de|para|na|no)\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+?)(?:\s|,|$)/i,
      /(lisboa|porto|coimbra|braga|aveiro|faro|setúbal|évora|viseu|leiria|santarém|bragança|castelo branco|guarda|portalegre|viana do castelo|vila real|funchal|angra do heroísmo)/i,
    ]

    let location = ""
    for (const pattern of locationPatterns) {
      const match = text.match(pattern)
      if (match) {
        location = match[1] || match[0]
        location = location.replace(/^(em|de|para|na|no)\s+/i, "").trim()
        break
      }
    }

    // Extrair categoria baseada em palavras-chave
    let category = "Outros"
    for (const cat of categories) {
      if (cat.keywords.some((keyword) => lowerText.includes(keyword))) {
        category = cat.category
        break
      }
    }

    // Extrair título (primeira parte da frase, geralmente o serviço)
    let title = ""
    const titlePatterns = [
      /(?:preciso|quero|necessito)\s+(?:de\s+)?(?:alguém\s+para\s+)?(.+?)(?:\s*,|\s+pago|\s+por|\s+em|\s+€|\s+euros?|$)/i,
      /(.+?)(?:\s*,|\s+pago|\s+por|\s+em|\s+€|\s+euros?)/i,
    ]

    for (const pattern of titlePatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        title = match[1].trim()
        // Limpar palavras desnecessárias do início
        title = title.replace(/^(preciso de|quero|necessito|alguém para|para)/i, "").trim()
        break
      }
    }

    // Se não encontrou título, usar as primeiras palavras
    if (!title) {
      const words = text.split(" ")
      title = words.slice(0, Math.min(5, words.length)).join(" ")
    }

    // Capitalizar primeira letra do título
    title = title.charAt(0).toUpperCase() + title.slice(1)

    // Estimar tempo baseado no tipo de serviço
    let estimatedTime = "2-3 horas"
    if (lowerText.includes("limpar") || lowerText.includes("limpeza")) {
      estimatedTime = "3-4 horas"
    } else if (lowerText.includes("montar") || lowerText.includes("móvel")) {
      estimatedTime = "1-2 horas"
    } else if (lowerText.includes("jardim") || lowerText.includes("jardinagem")) {
      estimatedTime = "2-4 horas"
    } else if (lowerText.includes("passear") || lowerText.includes("cão")) {
      estimatedTime = "1 hora"
    }

    return {
      title: title || "Serviço solicitado",
      description: text,
      category,
      price: price || 0,
      location: location || "",
      estimatedTime,
    }
  }

  const handleStartRecording = async () => {
    setError(null)

    try {
      // Verificar se o navegador suporta a API
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        throw new Error("Reconhecimento de voz não suportado neste navegador.")
      }

      // Parar instância anterior se existir
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }

      // Solicitar permissão do microfone se necessário
      // Nota: Edge às vezes precisa de um getUserMedia explícito para "acordar" a permissão
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Mantemos as tracks ativas por um momento para garantir que o navegador registre o uso
        setTimeout(() => {
          stream.getTracks().forEach((track) => track.stop())
        }, 500)
      } catch (permErr) {
        console.error("Permissão de microfone negada:", permErr)
        setError("Permissão de microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador.")
        return
      }

      // Inicializar o reconhecimento de voz
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      // Configurar o reconhecimento
      recognition.lang = "pt-PT" // Português de Portugal

      // Edge fix: 'continuous' e 'interimResults' causam instabilidade no Edge.
      // Desativamos para garantir funcionalidade básica.
      const isEdge = navigator.userAgent.indexOf("Edg") !== -1

      if (isEdge) {
        console.log("Edge detectado: Usando modo de compatibilidade (sem contínuo/interim)")
        recognition.continuous = false
        recognition.interimResults = false
      } else {
        recognition.continuous = true
        recognition.interimResults = true
      }

      recognition.maxAlternatives = 1

      // Manipular resultados
      recognition.onresult = (event: any) => {
        let transcript = ""
        let isFinal = false

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
          isFinal = event.results[i].isFinal
        }

        if (transcript) {
          addDebugLog(`Resultado parcial: "${transcript.substring(0, 20)}..." (Final: ${isFinal})`)
        }

        setVoiceText((prev) => {
          // Se for resultado final, adicionar ao texto existente
          if (isFinal) {
            return prev + " " + transcript
          }
          // Se for resultado parcial, mostrar no textarea mas não adicionar ao texto final
          if (textAreaRef.current) {
            textAreaRef.current.value = prev + " " + transcript
          }
          return prev
        })
      }

      // Manipular início
      recognition.onstart = () => {
        console.log("Reconhecimento de voz iniciado")
        addDebugLog("Evento: onstart (Voz iniciada)")
        setIsRecording(true)
        setError(null)
      }

      // Manipular fim do reconhecimento
      recognition.onend = () => {
        console.log("Reconhecimento de voz terminou")
        addDebugLog("Evento: onend (Voz terminou)")
        // Edge às vezes termina prematuramente. Só paramos se o usuário pediu ou se houve erro fatal.
        // Verificamos o estado 'isRecording' (que é gerenciado pelo React, cuidado com stale closures aqui)
        // Mas como onend é closure, precisamos usar a ref ou lógica externa se quisermos reiniciar.
        // Simplificação: Se cair, o usuário clica de novo, mas logs ajudam a debug.
        setIsRecording(false)
      }

      // Manipular erros
      recognition.onerror = (event: any) => {
        console.error("Erro de reconhecimento de voz:", event.error)
        addDebugLog(`Evento: onerror (${event.error})`)

        // Ignorar erros "no-speech" ou "aborted" que são comuns e não requerem feedback visual agressivo
        if (event.error === 'no-speech') {
          console.warn("Nenhuma fala detectada. Ignorando erro.")
          return
        }
        if (event.error === 'aborted') {
          console.warn("Reconhecimento abortado. Ignorando erro.")
          return
        }

        setError(`Erro no reconhecimento de voz: ${event.error}`)
        setIsRecording(false)
      }

      // Iniciar o reconhecimento
      addDebugLog("Chamando recognition.start()...")
      try {
        recognition.start()
        setVoiceText("") // Limpar texto anterior ao começar nova gravação
      } catch (startErr) {
        addDebugLog(`Erro ao chamar start(): ${startErr}`)
        throw startErr
      }
    } catch (err) {
      console.error("Erro ao iniciar reconhecimento de voz:", err)
      setError(
        `Não foi possível acessar o microfone. ${err instanceof Error ? err.message : "Verifique as permissões do navegador."}`,
      )
      setIsRecording(false)
    }
  }

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleProcessVoice = async () => {
    if (!voiceText.trim()) return

    setIsProcessing(true)

    try {
      // Processar o texto capturado
      const extractedData = extractDataFromText(voiceText)

      // Simular um pequeno atraso para processamento
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Enviar os dados processados
      onVoiceProcessed(extractedData)
      onClose()
      setVoiceText("")
      setIsRecording(false)
    } catch (err) {
      console.error("Erro ao processar voz:", err)
      setError("Ocorreu um erro ao processar o texto. Por favor, tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setVoiceText("")
    setIsRecording(false)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-indigo-600" />
            Criar Gig por Voz
          </DialogTitle>
          <DialogDescription>Descreva o serviço que precisa, incluindo o preço e localização</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mensagem de erro */}
          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Indicador de gravação */}
          <div className="flex flex-col items-center space-y-4 py-6">
            <div
              className={cn(
                "relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300",
                isRecording
                  ? "bg-red-100 border-4 border-red-300 animate-pulse"
                  : "bg-gray-100 border-4 border-gray-300",
              )}
            >
              {isRecording ? <MicOff className="h-8 w-8 text-red-600" /> : <Mic className="h-8 w-8 text-gray-600" />}

              {isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />}
            </div>

            {isRecording && (
              <div className="flex items-center space-x-2 text-red-600">
                <Volume2 className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">A gravar... Fale agora!</span>
              </div>
            )}

            <p className="text-sm text-gray-600 text-center max-w-xs">
              {isRecording
                ? "Diga algo como: 'Preciso de alguém para limpar o meu apartamento, pago 45 euros em Lisboa'"
                : "Clique para começar a gravar o seu pedido"}
            </p>
          </div>

          {/* Texto reconhecido */}
          <div className="space-y-2">
            <Label htmlFor="voice-text">Texto reconhecido:</Label>
            <Textarea
              ref={textAreaRef}
              id="voice-text"
              placeholder="O texto reconhecido aparecerá aqui..."
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              rows={4}
              className="resize-none"
              readOnly={isRecording}
            />
            {isRecording && (
              <p className="text-xs text-gray-500 italic">
                Fale claramente. O texto será atualizado automaticamente enquanto fala.
              </p>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex justify-center space-x-3">
            {!isRecording ? (
              <>
                <Button onClick={handleStartRecording} className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Começar Gravação
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleStopRecording} variant="destructive" className="flex items-center gap-2">
                  <MicOff className="h-4 w-4" />
                  Parar Gravação
                </Button>
                <Button
                  onClick={handleProcessVoice}
                  disabled={!voiceText.trim() || isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Processar Voz
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Área de Debug (Visível apenas se houver logs) */}
          {debugLogs.length > 0 && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono max-h-32 overflow-y-auto border border-gray-200">
              <p className="font-bold text-gray-700 mb-1">Debug Logs:</p>
              {debugLogs.map((log, i) => (
                <div key={i} className="text-gray-600 border-b border-gray-200 last:border-0 py-0.5">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
