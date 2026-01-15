// Configuração do Google Analytics 4
export const GA_MEASUREMENT_ID = "G-81969ZG3NR"

// Tipos de eventos personalizados para o Biskate
export interface BiskateAnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
  gig_id?: string
  user_id?: string
  gig_category?: string
  search_term?: string
}

export class GoogleAnalyticsService {
  private static instance: GoogleAnalyticsService
  private measurementId: string

  private constructor() {
    this.measurementId = GA_MEASUREMENT_ID
  }

  public static getInstance(): GoogleAnalyticsService {
    if (!GoogleAnalyticsService.instance) {
      GoogleAnalyticsService.instance = new GoogleAnalyticsService()
    }
    return GoogleAnalyticsService.instance
  }

  // Verificar se GA está carregado
  private isGALoaded(): boolean {
    return typeof window !== "undefined" && typeof window.gtag === "function"
  }

  // Tracking de página
  public trackPageView(url: string, title?: string): void {
    if (!this.isGALoaded()) return

    window.gtag("config", this.measurementId, {
      page_path: url,
      page_title: title || document.title,
      page_location: window.location.href,
    })
  }

  // Tracking de eventos genéricos
  public trackEvent(event: BiskateAnalyticsEvent): void {
    if (!this.isGALoaded()) return

    window.gtag("event", event.action, {
      event_category: event.category,
      event_label: event.label || "",
      value: event.value || 0,
      custom_parameter_gig_id: event.gig_id,
      custom_parameter_user_id: event.user_id,
      custom_parameter_gig_category: event.gig_category,
      custom_parameter_search_term: event.search_term,
    })
  }

  // Eventos específicos do Biskate
  public trackGigCreated(gigId: string, category: string, userId?: string): void {
    this.trackEvent({
      action: "gig_created",
      category: "gigs",
      label: `Gig criado na categoria ${category}`,
      gig_id: gigId,
      user_id: userId,
      gig_category: category,
    })
  }

  public trackGigViewed(gigId: string, category: string): void {
    this.trackEvent({
      action: "gig_viewed",
      category: "engagement",
      label: "Visualização de gig",
      gig_id: gigId,
      gig_category: category,
    })
  }

  public trackUserRegistration(method: "email" | "google" | "facebook" = "email"): void {
    this.trackEvent({
      action: "sign_up",
      category: "authentication",
      label: `Registo via ${method}`,
    })

    // Evento de conversão
    window.gtag("event", "conversion", {
      send_to: `${this.measurementId}/sign_up`,
    })
  }

  public trackUserLogin(method: "email" | "google" | "facebook" = "email"): void {
    this.trackEvent({
      action: "login",
      category: "authentication",
      label: `Login via ${method}`,
    })
  }

  public trackContactViewed(gigId: string, gigCategory: string): void {
    this.trackEvent({
      action: "contact_viewed",
      category: "conversion",
      label: "Contacto visualizado",
      gig_id: gigId,
      gig_category: gigCategory,
      value: 1,
    })

    // Evento de conversão importante
    window.gtag("event", "conversion", {
      send_to: `${this.measurementId}/contact_view`,
    })
  }

  public trackProposalSent(gigId: string, gigCategory: string): void {
    this.trackEvent({
      action: "proposal_sent",
      category: "conversion",
      label: "Proposta enviada",
      gig_id: gigId,
      gig_category: gigCategory,
      value: 5,
    })

    // Evento de conversão de alta prioridade
    window.gtag("event", "conversion", {
      send_to: `${this.measurementId}/proposal_sent`,
    })
  }

  public trackSearch(searchTerm: string, resultsCount: number): void {
    this.trackEvent({
      action: "search",
      category: "engagement",
      label: `Pesquisa: ${searchTerm}`,
      search_term: searchTerm,
      value: resultsCount,
    })
  }

  public trackError(errorType: string, errorMessage: string): void {
    this.trackEvent({
      action: "error",
      category: "technical",
      label: `${errorType}: ${errorMessage}`,
    })
  }
}

// Instância singleton
export const analytics = GoogleAnalyticsService.getInstance()
