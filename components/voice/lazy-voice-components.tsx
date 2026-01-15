"use client"

import dynamic from "next/dynamic"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Lazy load dos componentes de voz que são pesados
export const AIConversation = dynamic(
  () => import("./ai-conversation").then((mod) => ({ default: mod.AIConversation })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text="Carregando conversa com IA..." />
      </div>
    ),
    ssr: false,
  },
)

export const VoiceInputModal = dynamic(
  () => import("./voice-input-modal").then((mod) => ({ default: mod.VoiceInputModal })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner size="sm" text="Carregando entrada de voz..." />
      </div>
    ),
    ssr: false,
  },
)

export const VoiceCapture = dynamic(() => import("./voice-capture").then((mod) => ({ default: mod.VoiceCapture })), {
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <LoadingSpinner size="sm" text="Carregando captura de voz..." />
    </div>
  ),
  ssr: false,
})
