"use client"

// Re-exportar tudo do contexto principal para manter compatibilidade
export { AuthProvider as AuthProductionProvider, useAuth } from "./auth-context"

// Exportação adicional para compatibilidade
export { AuthProvider } from "./auth-context"
