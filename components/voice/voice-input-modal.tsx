"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VoiceInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (text: string) => void
}

export function VoiceInputModal({ isOpen, onClose, onSubmit }: VoiceInputModalProps) {
  const [inputText, setInputText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const [speechSupported, setSpeechSupported] = useState(false)

  useEffect(() => {
    // Verificar se o navegador suporta reconhecimento de voz
    const isSupported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window
    setSpeechSupported(isSupported)
  }, [])

  const handleSubmit = () => {
    if (inputText.trim()) {
      onSubmit(inputText.trim())
      setInputText("")
      onClose()
    }
  }

  const startRecording = async () => {
    setError(null)

    try {
      // Verificar se o navegador suporta a API
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        throw new Error("Reconhecimento de voz não suportado neste navegador.")
      }

      // Solicitar permissão do microfone
      await navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        // Liberar o microfone após obter permissão
        stream.getTracks().forEach((track) => track.stop())
      })

      // Inicializar o reconhecimento de voz
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      // Configurar o reconhecimento
      recognition.lang = "pt-PT" // Português de Portugal
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      let finalTranscript = ""

      // Manipular resultados
      recognition.onresult = (event: any) => {
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
            setInputText((prev) => prev + transcript + " ")
          } else {
            interimTranscript += transcript
          }
        }
      }

      // Manipular fim do reconhecimento
      recognition.onend = () => {
        setIsRecording(false)
      }

      // Manipular erros
      recognition.onerror = (event: any) => {
        console.error("Erro de reconhecimento de voz:", event.error)
        setError(`Erro no reconhecimento de voz: ${event.error}`)
        setIsRecording(false)
      }

      // Iniciar o reconhecimento
      recognition.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Erro ao iniciar reconhecimento de voz:", err)
      setError(
        `Não foi possível acessar o microfone. ${err instanceof Error ? err.message : "Verifique as permissões do navegador."}`,
      )
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-indigo-600" />
            Voz capturada
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {speechSupported
                ? "Clique no botão para gravar sua voz ou digite diretamente:"
                : "Seu navegador não suporta reconhecimento de voz. Por favor, digite o texto:"}
            </p>

            {speechSupported && (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                className="flex items-center gap-1"
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    <span>Parar</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    <span>Gravar</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ex: Preciso de alguém para limpar meu apartamento..."
            className="min-h-[100px]"
            autoFocus
          />

          {isRecording && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              Gravando... Fale claramente.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!inputText.trim()}>
            Processar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
