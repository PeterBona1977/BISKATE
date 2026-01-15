"use client"

export interface SpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  silenceTimeout?: number
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export class SpeechRecognitionService {
  private recognition: any = null
  private isSupported = false
  private isListening = false
  private silenceTimer: NodeJS.Timeout | null = null
  private lastSpeechTime = 0
  private options: SpeechRecognitionOptions = {}

  // Callbacks
  public onResult: ((result: SpeechRecognitionResult) => void) | null = null
  public onEnd: ((finalTranscript: string) => void) | null = null
  public onError: ((error: string) => void) | null = null
  public onSilenceDetected: (() => void) | null = null

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.isSupported = true
        this.setupRecognition()
      }
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return

    this.recognition.onresult = (event: any) => {
      this.lastSpeechTime = Date.now()
      this.resetSilenceTimer()

      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }

        // Chamar callback de resultado
        if (this.onResult) {
          this.onResult({
            transcript: result.isFinal ? finalTranscript : interimTranscript,
            confidence: result[0].confidence || 0,
            isFinal: result.isFinal,
          })
        }
      }

      // Se temos um resultado final, iniciar timer de silêncio
      if (finalTranscript && this.options.silenceTimeout) {
        this.startSilenceTimer(finalTranscript)
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.clearSilenceTimer()
    }

    this.recognition.onerror = (event: any) => {
      this.isListening = false
      this.clearSilenceTimer()
      if (this.onError) {
        this.onError(`Erro no reconhecimento de voz: ${event.error}`)
      }
    }
  }

  private startSilenceTimer(finalTranscript: string): void {
    this.clearSilenceTimer()

    const timeout = this.options.silenceTimeout || 2000 // 2 segundos por padrão

    this.silenceTimer = setTimeout(() => {
      if (Date.now() - this.lastSpeechTime >= timeout) {
        // Silêncio detectado
        this.stop()
        if (this.onSilenceDetected) {
          this.onSilenceDetected()
        }
        if (this.onEnd) {
          this.onEnd(finalTranscript)
        }
      }
    }, timeout)
  }

  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  async start(options: SpeechRecognitionOptions = {}): Promise<void> {
    if (!this.isSupported) {
      throw new Error("Reconhecimento de voz não é suportado neste navegador")
    }

    if (this.isListening) {
      this.stop()
    }

    this.options = {
      lang: "pt-PT",
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      silenceTimeout: 2000,
      ...options,
    }

    // Configurar reconhecimento
    this.recognition.lang = this.options.lang
    this.recognition.continuous = this.options.continuous
    this.recognition.interimResults = this.options.interimResults
    this.recognition.maxAlternatives = this.options.maxAlternatives

    // Solicitar permissão do microfone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop()) // Liberar imediatamente
    } catch (error) {
      throw new Error("Não foi possível acessar o microfone")
    }

    // Iniciar reconhecimento
    this.recognition.start()
    this.isListening = true
    this.lastSpeechTime = Date.now()
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
    this.isListening = false
    this.clearSilenceTimer()
  }

  isCurrentlyListening(): boolean {
    return this.isListening
  }

  isRecognitionSupported(): boolean {
    return this.isSupported
  }
}

// Instância singleton
export const speechRecognitionService = new SpeechRecognitionService()
