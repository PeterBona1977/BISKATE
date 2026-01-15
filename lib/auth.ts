"use client"

export type User = {
  id: string
  email: string
  full_name: string
  role: "user" | "admin"
  plan: "free" | "essential" | "pro" | "unlimited"
  responses_used: number
  responses_available: number
  created_at: string
}

// Usuários pré-definidos para teste
const DEFAULT_USERS: User[] = [
  {
    id: "admin-1",
    email: "admin@biskate.com",
    full_name: "Administrador BISKATE",
    role: "admin",
    plan: "unlimited",
    responses_used: 0,
    responses_available: 999999,
    created_at: new Date().toISOString(),
  },
  {
    id: "user-1",
    email: "user@biskate.com",
    full_name: "Utilizador BISKATE",
    role: "user",
    plan: "free",
    responses_used: 0,
    responses_available: 1,
    created_at: new Date().toISOString(),
  },
]

class AuthService {
  private storageKey = "biskate_auth"
  private usersKey = "biskate_users"

  constructor() {
    // Inicializar usuários padrão se não existirem
    if (typeof window !== "undefined") {
      const existingUsers = this.getAllUsers()
      if (existingUsers.length === 0) {
        localStorage.setItem(this.usersKey, JSON.stringify(DEFAULT_USERS))
      }
    }
  }

  private getAllUsers(): User[] {
    if (typeof window === "undefined") return []
    const users = localStorage.getItem(this.usersKey)
    return users ? JSON.parse(users) : []
  }

  private saveUsers(users: User[]): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.usersKey, JSON.stringify(users))
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null
    const userData = localStorage.getItem(this.storageKey)
    return userData ? JSON.parse(userData) : null
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 800))

    const users = this.getAllUsers()
    const user = users.find((u) => u.email === email)

    if (!user) {
      return { user: null, error: "Email não encontrado" }
    }

    // Verificar password (simulado - em produção seria hash)
    const validPasswords: Record<string, string> = {
      "admin@biskate.com": "admin123",
      "user@biskate.com": "user123",
    }

    if (validPasswords[email] !== password) {
      return { user: null, error: "Password incorreta" }
    }

    // Salvar sessão
    if (typeof window !== "undefined") {
      localStorage.setItem(this.storageKey, JSON.stringify(user))
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

    const users = this.getAllUsers()

    // Verificar se email já existe
    if (users.some((u) => u.email === email)) {
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
      responses_available: 1,
      created_at: new Date().toISOString(),
    }

    // Adicionar aos usuários
    users.push(newUser)
    this.saveUsers(users)

    // Salvar sessão
    if (typeof window !== "undefined") {
      localStorage.setItem(this.storageKey, JSON.stringify(newUser))
    }

    return { user: newUser, error: null }
  }

  async signOut(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.storageKey)
    }
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    const users = this.getAllUsers()
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) return null

    users[userIndex] = { ...users[userIndex], ...updates }
    this.saveUsers(users)

    // Atualizar sessão se for o usuário atual
    const currentUser = this.getCurrentUser()
    if (currentUser?.id === userId) {
      if (typeof window !== "undefined") {
        localStorage.setItem(this.storageKey, JSON.stringify(users[userIndex]))
      }
    }

    return users[userIndex]
  }

  getAllUsersForAdmin(): User[] {
    return this.getAllUsers()
  }
}

export const authService = new AuthService()
