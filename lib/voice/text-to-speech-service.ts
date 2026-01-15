"use client"

export interface TTSOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  voiceName?: string
}

export class TextToSpeechService {
  private synthesis: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private isInitialized = false

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis
      this.initializeVoices()
    }
  }

  private async initializeVoices(): Promise<void> {
    if (!this.synthesis) return

    // Aguardar que as vozes sejam carregadas
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.voices = this.synthesis!.getVoices()
        this.isInitialized = true
        resolve()
      }

      if (this.synthesis.getVoices().length > 0) {
        loadVoices()
      } else {
        this.synthesis.onvoiceschanged = loadVoices
      }
    })
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeVoices()
    }
  }

  private findBestVoice(lang = "pt-PT"): SpeechSynthesisVoice | null {
    // Definir preferências de vozes naturais/femininas
    const naturalKeywords = ["natural", "google", "microsoft", "premium", "neural"]
    const femaleKeywords = ["female", "maria", "joana", "sofia", "helena", "zira", "aria", "samantha", "victoria"]

    const scoreVoice = (voice: SpeechSynthesisVoice) => {
      let score = 0
      const name = voice.name.toLowerCase()

      // Bónus por ser a língua correta
      if (voice.lang.includes(lang.split('-')[0])) score += 10
      if (voice.lang === lang) score += 5

      // Bónus por voz natural/neural
      if (naturalKeywords.some(keyword => name.includes(keyword))) score += 5

      // Bónus por voz feminina (preferência do utilizador)
      if (femaleKeywords.some(keyword => name.includes(keyword))) score += 8

      return score
    }

    // Ordenar vozes por pontuação
    const sortedVoices = [...this.voices]
      .filter(v => v.lang.includes(lang.split('-')[0]) || v.lang.includes("en")) // Filtrar por língua ou fallback en
      .sort((a, b) => scoreVoice(b) - scoreVoice(a))

    if (sortedVoices.length > 0) {
      return sortedVoices[0]
    }

    // Fallback para voz padrão
    return this.voices.find((voice) => voice.default) || this.voices[0] || null
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.synthesis) {
      throw new Error("Text-to-Speech não é suportado neste navegador")
    }

    await this.ensureInitialized()

    // Parar qualquer fala anterior
    this.synthesis.cancel()

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)

      // Configurar opções
      utterance.lang = options.lang || "pt-PT"
      utterance.rate = options.rate || 0.9
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume || 1

      // Selecionar a melhor voz
      const voice = this.findBestVoice(utterance.lang)
      if (voice) {
        utterance.voice = voice
      }

      // Eventos
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Erro na síntese de voz: ${event.error}`))

      // Falar
      this.synthesis.speak(utterance)
    })
  }

  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  isSupported(): boolean {
    return this.synthesis !== null
  }
}

// Instância singleton
export const ttsService = new TextToSpeechService()
