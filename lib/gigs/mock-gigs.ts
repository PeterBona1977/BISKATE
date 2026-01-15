"use client"

export type Gig = {
  id: string
  title: string
  description: string
  category: string
  price: number
  location: string
  estimated_time: string
  is_premium: boolean
  status: "pending" | "approved" | "rejected" | "in_progress" | "completed" | "cancelled"
  rejection_reason?: string
  author_id: string
  author_name: string
  author_email: string
  author_phone?: string
  created_at: string
  updated_at: string
}

export type GigResponse = {
  id: string
  gig_id: string
  responder_id: string
  responder_name: string
  created_at: string
}

class MockGigsService {
  private gigs: Gig[] = [
    {
      id: "gig-1",
      title: "Limpeza de Apartamento",
      description:
        "Preciso de ajuda para limpeza completa de um apartamento T2. Inclui cozinha, casa de banho e quartos.",
      category: "Limpeza",
      price: 45.0,
      location: "Lisboa, Avenidas Novas",
      estimated_time: "3-4 horas",
      is_premium: false,
      status: "approved",
      author_id: "user-1",
      author_name: "Maria Silva",
      author_email: "maria@example.com",
      author_phone: "+351 912 345 678",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "gig-2",
      title: "Montagem de Móveis IKEA",
      description:
        "Tenho vários móveis da IKEA para montar: 1 estante, 1 mesa e 2 cadeiras. Todas as ferramentas incluídas.",
      category: "Reparações",
      price: 60.0,
      location: "Porto, Cedofeita",
      estimated_time: "2-3 horas",
      is_premium: true,
      status: "approved",
      author_id: "user-2",
      author_name: "João Santos",
      author_email: "joao@example.com",
      author_phone: "+351 923 456 789",
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "gig-3",
      title: "Passeio com Cão",
      description:
        "Preciso de alguém para passear com o meu golden retriever durante a semana. Cão muito dócil e obediente.",
      category: "Animais",
      price: 15.0,
      location: "Braga, Centro",
      estimated_time: "1 hora",
      is_premium: false,
      status: "pending",
      author_id: "user-3",
      author_name: "Ana Costa",
      author_email: "ana@example.com",
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ]

  private responses: GigResponse[] = []

  getAllGigs(): Gig[] {
    return [...this.gigs]
  }

  getApprovedGigs(): Gig[] {
    return this.gigs.filter((gig) => gig.status === "approved")
  }

  getPendingGigs(): Gig[] {
    return this.gigs.filter((gig) => gig.status === "pending")
  }

  getUserGigs(userId: string): Gig[] {
    return this.gigs.filter((gig) => gig.author_id === userId)
  }

  getGigById(id: string): Gig | null {
    return this.gigs.find((gig) => gig.id === id) || null
  }

  createGig(gigData: Omit<Gig, "id" | "created_at" | "updated_at">): Gig {
    const newGig: Gig = {
      ...gigData,
      id: `gig-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this.gigs.unshift(newGig)
    return newGig
  }

  updateGig(id: string, updates: Partial<Gig>): Gig | null {
    const gigIndex = this.gigs.findIndex((gig) => gig.id === id)
    if (gigIndex === -1) return null

    this.gigs[gigIndex] = {
      ...this.gigs[gigIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    return this.gigs[gigIndex]
  }

  deleteGig(id: string): boolean {
    const gigIndex = this.gigs.findIndex((gig) => gig.id === id)
    if (gigIndex === -1) return false

    this.gigs.splice(gigIndex, 1)
    return true
  }

  respondToGig(gigId: string, responderId: string, responderName: string): GigResponse | null {
    // Verificar se o biskate existe
    const biskate = this.getGigById(gigId)
    if (!biskate) return null

    // Verificar se já respondeu
    const existingResponse = this.responses.find((r) => r.gig_id === gigId && r.responder_id === responderId)
    if (existingResponse) return null

    const response: GigResponse = {
      id: `response-${Date.now()}`,
      gig_id: gigId,
      responder_id: responderId,
      responder_name: responderName,
      created_at: new Date().toISOString(),
    }

    this.responses.push(response)
    return response
  }

  getGigResponses(gigId: string): GigResponse[] {
    return this.responses.filter((r) => r.gig_id === gigId)
  }

  getUserResponses(userId: string): GigResponse[] {
    return this.responses.filter((r) => r.responder_id === userId)
  }

  hasUserRespondedToGig(gigId: string, userId: string): boolean {
    return this.responses.some((r) => r.gig_id === gigId && r.responder_id === userId)
  }
}

export const mockGigs = new MockGigsService()
