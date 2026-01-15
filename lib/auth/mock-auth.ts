"use client"

// Sistema de autenticação simulado para funcionar sem Supabase
export type User = {
  id: string
  email: string
  full_name: string
  role: "user" | "admin"
  plan: "free" | "essential" | "pro" | "unlimited"
  responses_used: number
  created_at: string
}

// Usuários de teste pré-definidos
const MOCK_USERS: User[] = [
  {
    id: "admin-1",
    email: "admin@biskate.com",
    full_name: "Administrador BISKATE",
    role: "admin",
    plan: "unlimited",
    responses_used: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "user-1",
    email: "user@biskate.com",
    full_name: "Utilizador BISKATE",
    role: "user",
    plan: "free",
    responses_used: 0,
    created_at: new Date().toISOString(),
  },
]

class MockAuthService {
  private currentUser: User | null = null
  private users: User[] = [...MOCK_USERS]

  constructor() {
    // Verificar se há usuário logado no localStorage
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("biskate_user")
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser)
      }
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verificar credenciais
    const user = this.users.find((u) => u.email === email)

    if (!user) {
      return { user: null, error: "Utilizador não encontrado" }
    }

    // Verificar password (simulado)
    const validPasswords: Record<string, string> = {
      "admin@biskate.com": "admin123",
      "user@biskate.com": "user123",
    }

    if (validPasswords[email] !== password) {
      return { user: null, error: "Password incorreta" }
    }

    this.currentUser = user
    if (typeof window !== "undefined") {
      localStorage.setItem("biskate_user", JSON.stringify(user))
    }

    return { user, error: null }
  }

  async signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ user: User | null; error: string | null }> {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verificar se o usuário já existe
    const existingUser = this.users.find((u) => u.email === email)
    if (existingUser) {
      return { user: null, error: "Este email já está registado" }
    }

    // Criar novo usuário
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      full_name: fullName,
      role: email === "admin@biskate.com" ? "admin" : "user",
      plan: "free",
      responses_used: 0,
      created_at: new Date().toISOString(),
    }

    this.users.push(newUser)
    this.currentUser = newUser

    if (typeof window !== "undefined") {
      localStorage.setItem("biskate_user", JSON.stringify(newUser))
    }

    return { user: newUser, error: null }
  }

  async signOut(): Promise<void> {
    this.currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("biskate_user")
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  getAllUsers(): User[] {
    return [...this.users]
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    const userIndex = this.users.findIndex((u) => u.id === userId)
    if (userIndex === -1) return null

    this.users[userIndex] = { ...this.users[userIndex], ...updates }

    if (this.currentUser?.id === userId) {
      this.currentUser = this.users[userIndex]
      if (typeof window !== "undefined") {
        localStorage.setItem("biskate_user", JSON.stringify(this.currentUser))
      }
    }

    return this.users[userIndex]
  }
}

export const mockAuth = new MockAuthService()
