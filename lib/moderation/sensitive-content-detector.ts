// =====================================================
// BISKATE - SISTEMA DE DETEÇÃO DE INFORMAÇÃO SENSÍVEL
// Algoritmo robusto para detetar contactos e info sensível
// =====================================================

export interface DetectionResult {
  hasSensitiveContent: boolean
  detectedPatterns: string[]
  highlightedText: string
  severity: "low" | "medium" | "high" | "critical"
  suggestions: string[]
}

export class SensitiveContentDetector {
  // Padrões de deteção organizados por categoria
  private static readonly PATTERNS = {
    // 1. CONTACTOS DIRETOS
    phone: {
      patterns: [
        // Números portugueses
        /(\+351\s?)?[29]\d{8}/gi,
        /(\+351\s?)?[29]\d{2}\s?\d{3}\s?\d{3}/gi,
        // Números internacionais
        /\+\d{1,4}\s?\d{6,14}/gi,
        // Números genéricos
        /\b\d{9,15}\b/gi,
      ],
      severity: "high" as const,
      message: "Número de telefone detectado",
    },
    email: {
      patterns: [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi],
      severity: "high" as const,
      message: "Email detectado",
    },
    socialMedia: {
      patterns: [
        /(?:facebook\.com\/|fb\.com\/|instagram\.com\/|insta\.com\/|linkedin\.com\/|twitter\.com\/|tiktok\.com\/)[\w.-]+/gi,
        /(?:@|#)[\w.-]+/gi,
      ],
      severity: "medium" as const,
      message: "Link de rede social detectado",
    },

    // 2. APPS DE MENSAGENS
    messagingApps: {
      patterns: [
        /\b(?:whatsapp|whats app|wpp|zap)\b/gi,
        /\b(?:telegram|tg)\b/gi,
        /\b(?:discord|skype|viber|signal)\b/gi,
        /\b(?:messenger|fb messenger)\b/gi,
      ],
      severity: "high" as const,
      message: "Menção a app de mensagens detectada",
    },

    // 3. MÉTODOS DE PAGAMENTO EXTERNOS
    externalPayment: {
      patterns: [
        /\b(?:mbway|mb way|multibanco)\b/gi,
        /\b(?:paypal|pay pal)\b/gi,
        /\b(?:transferência bancária|transferencia|iban|nib)\b/gi,
        /\b(?:revolut|wise|n26)\b/gi,
        /\b(?:pagamento direto|pagamento fora|pagar fora)\b/gi,
        /\b(?:dinheiro|cash|numerário)\b/gi,
      ],
      severity: "critical" as const,
      message: "Método de pagamento externo detectado",
    },

    // 4. ENDEREÇOS E LOCALIZAÇÕES ESPECÍFICAS
    addresses: {
      patterns: [
        /\b(?:rua|avenida|av\.|r\.|travessa|largo|praça)\s+[\w\s]+,?\s*\d+/gi,
        /\b\d{4}-\d{3}\s+[\w\s]+/gi, // Código postal português
        /\b(?:morada|endereço|localização exata)\b/gi,
      ],
      severity: "medium" as const,
      message: "Endereço específico detectado",
    },

    // 5. TENTATIVAS DE CONTORNO
    bypass: {
      patterns: [
        /\b(?:contacta-me|contactar|liga-me|chama-me)\b/gi,
        /\b(?:fora da plataforma|fora do site|fora daqui)\b/gi,
        /\b(?:em privado|privadamente|offline)\b/gi,
        /\b(?:meu número|meu email|meu contacto)\b/gi,
      ],
      severity: "high" as const,
      message: "Tentativa de contorno da plataforma detectada",
    },
  }

  /**
   * Analisa texto em busca de informação sensível
   */
  static analyzeContent(text: string): DetectionResult {
    if (!text || text.trim().length === 0) {
      return {
        hasSensitiveContent: false,
        detectedPatterns: [],
        highlightedText: text,
        severity: "low",
        suggestions: [],
      }
    }

    const detectedPatterns: string[] = []
    let highlightedText = text
    let maxSeverity: "low" | "medium" | "high" | "critical" = "low"
    const suggestions: string[] = []

    // Analisar cada categoria de padrões
    Object.entries(this.PATTERNS).forEach(([category, config]) => {
      config.patterns.forEach((pattern) => {
        const matches = text.match(pattern)
        if (matches) {
          matches.forEach((match) => {
            detectedPatterns.push(`${config.message}: "${match}"`)

            // Destacar no texto
            highlightedText = highlightedText.replace(
              new RegExp(this.escapeRegExp(match), "gi"),
              `<mark class="bg-red-200 text-red-800 font-semibold">${match}</mark>`,
            )
          })

          // Atualizar severidade máxima
          if (this.getSeverityLevel(config.severity) > this.getSeverityLevel(maxSeverity)) {
            maxSeverity = config.severity
          }

          // Adicionar sugestões específicas
          suggestions.push(...this.getSuggestions(category))
        }
      })
    })

    return {
      hasSensitiveContent: detectedPatterns.length > 0,
      detectedPatterns,
      highlightedText,
      severity: maxSeverity,
      suggestions: [...new Set(suggestions)], // Remove duplicatas
    }
  }

  /**
   * Converte severidade em número para comparação
   */
  private static getSeverityLevel(severity: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 }
    return levels[severity as keyof typeof levels] || 1
  }

  /**
   * Escapa caracteres especiais para regex
   */
  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  /**
   * Retorna sugestões baseadas na categoria detectada
   */
  private static getSuggestions(category: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      phone: ["Remova números de telefone do texto", "Use a plataforma para comunicação inicial"],
      email: ["Remova endereços de email", "A plataforma facilitará o contacto após a resposta"],
      socialMedia: ["Remova links de redes sociais", "Mantenha a comunicação na plataforma"],
      messagingApps: ["Evite mencionar apps de mensagens externas", "Use o sistema de mensagens da plataforma"],
      externalPayment: [
        "Não mencione métodos de pagamento externos",
        "Use apenas o sistema de pagamento da plataforma",
      ],
      addresses: ["Evite endereços específicos", "Use apenas a zona/cidade geral"],
      bypass: ["Mantenha toda a comunicação na plataforma", "Evite solicitar contacto direto"],
    }

    return suggestionMap[category] || []
  }

  /**
   * Versão simplificada para verificação rápida
   */
  static hasSensitiveContent(text: string): boolean {
    return this.analyzeContent(text).hasSensitiveContent
  }

  /**
   * Limpa texto removendo informação sensível automaticamente
   */
  static cleanContent(text: string): string {
    let cleanedText = text

    // Aplicar limpeza automática para padrões críticos
    Object.entries(this.PATTERNS).forEach(([category, config]) => {
      if (config.severity === "critical" || config.severity === "high") {
        config.patterns.forEach((pattern) => {
          cleanedText = cleanedText.replace(pattern, "[INFORMAÇÃO REMOVIDA]")
        })
      }
    })

    return cleanedText
  }
}

// Função utilitária para uso em hooks/componentes
export function useSensitiveContentDetection() {
  const analyzeContent = (text: string) => {
    return SensitiveContentDetector.analyzeContent(text)
  }

  const hasSensitiveContent = (text: string) => {
    return SensitiveContentDetector.hasSensitiveContent(text)
  }

  const cleanContent = (text: string) => {
    return SensitiveContentDetector.cleanContent(text)
  }

  return {
    analyzeContent,
    hasSensitiveContent,
    cleanContent,
  }
}
