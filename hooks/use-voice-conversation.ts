"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export type InputMethod = "voice" | "text"
export type ConversationState = "idle" | "listening" | "processing" | "speaking"

interface VoiceConversationState {
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  lastInputMethod: InputMethod | null
  conversationState: ConversationState
  error: string | null
}

export function useVoiceConversation() {
  const [state, setState] = useState<VoiceConversationState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    lastInputMethod: null,
    conversationState: "idle",
    error: null,
  })

  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isVoiceSupportedRef = useRef<boolean>(false)

  // Verificar suporte a voz
  useEffect(() => {
    const speechRecognitionSupported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window
    const speechSynthesisSupported = "speechSynthesis" in window
    isVoiceSupportedRef.current = speechRecognitionSupported && speechSynthesisSupported
  }, [])

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel()
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [])

  const updateState = useCallback((updates: Partial<VoiceConversationState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const setConversationState = useCallback(
    (conversationState: ConversationState) => {
      updateState({
        conversationState,
        isListening: conversationState === "listening",
        isProcessing: conversationState === "processing",
        isSpeaking: conversationState === "speaking",
      })
    },
    [updateState],
  )

  const setLastInputMethod = useCallback(
    (method: InputMethod) => {
      updateState({ lastInputMethod: method })
    },
    [updateState],
  )

  const setError = useCallback(
    (error: string | null) => {
      updateState({ error })
    },
    [updateState],
  )

  const stopAllAudio = useCallback(() => {
    // Parar reconhecimento de voz
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    // Parar síntese de voz
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    // Limpar timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    setConversationState("idle")
  }, [setConversationState])

  return {
    state,
    recognitionRef,
    speechSynthesisRef,
    silenceTimerRef,
    isVoiceSupported: isVoiceSupportedRef.current,
    setConversationState,
    setLastInputMethod,
    setError,
    stopAllAudio,
  }
}
