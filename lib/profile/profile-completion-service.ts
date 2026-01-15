import type { Database } from "@/lib/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export interface ProfileCompletionStep {
  id: string
  title: string
  description: string
  completed: boolean
  points: number
  priority: number
  action: string
  href: string
}

export interface ProfileCompletionData {
  completionPercentage: number
  totalPoints: number
  earnedPoints: number
  nextSteps: ProfileCompletionStep[]
  completedSteps: ProfileCompletionStep[]
  message: string
  color: string
}

export class ProfileCompletionService {
  private static readonly MAX_POINTS = 100

  private static readonly STEPS: Omit<ProfileCompletionStep, "completed">[] = [
    {
      id: "avatar",
      title: "Adicionar foto de perfil",
      description: "Uma foto profissional aumenta a confiança dos clientes",
      points: 20,
      priority: 1,
      action: "Carregar foto",
      href: "/dashboard/profile#avatar",
    },
    {
      id: "full_name",
      title: "Completar nome completo",
      description: "O seu nome completo ajuda na identificação",
      points: 15,
      priority: 2,
      action: "Adicionar nome",
      href: "/dashboard/profile#name",
    },
    {
      id: "bio",
      title: "Escrever biografia",
      description: "Conte a sua história profissional (mín. 20 caracteres)",
      points: 15,
      priority: 3,
      action: "Escrever bio",
      href: "/dashboard/profile#bio",
    },
    {
      id: "skills",
      title: "Adicionar competências",
      description: "Liste as suas principais competências técnicas",
      points: 15,
      priority: 4,
      action: "Adicionar skills",
      href: "/dashboard/profile#skills",
    },
    {
      id: "location",
      title: "Definir localização",
      description: "Ajuda clientes locais a encontrá-lo",
      points: 10,
      priority: 5,
      action: "Adicionar local",
      href: "/dashboard/profile#location",
    },
    {
      id: "hourly_rate",
      title: "Definir taxa horária",
      description: "Estabeleça o seu valor por hora de trabalho",
      points: 10,
      priority: 6,
      action: "Definir preço",
      href: "/dashboard/profile#rate",
    },
    {
      id: "portfolio",
      title: "Adicionar portfólio",
      description: "Mostre exemplos do seu trabalho",
      points: 15,
      priority: 7,
      action: "Adicionar portfólio",
      href: "/dashboard/profile#portfolio",
    },
  ]

  static calculateCompletion(profile: Profile | null): ProfileCompletionData {
    if (!profile) {
      return {
        completionPercentage: 0,
        totalPoints: this.MAX_POINTS,
        earnedPoints: 0,
        nextSteps: this.STEPS.map((step) => ({ ...step, completed: false })).slice(0, 3),
        completedSteps: [],
        message: "Comece a completar o seu perfil para atrair mais clientes!",
        color: "red",
      }
    }

    const steps = this.STEPS.map((step) => ({
      ...step,
      completed: this.isStepCompleted(step.id, profile),
    }))

    const completedSteps = steps.filter((step) => step.completed)
    const incompleteSteps = steps.filter((step) => !step.completed)

    const earnedPoints = completedSteps.reduce((sum, step) => sum + step.points, 0)
    const completionPercentage = Math.round((earnedPoints / this.MAX_POINTS) * 100)

    // Sort incomplete steps by priority and take top 3
    const nextSteps = incompleteSteps.sort((a, b) => a.priority - b.priority).slice(0, 3)

    return {
      completionPercentage,
      totalPoints: this.MAX_POINTS,
      earnedPoints,
      nextSteps,
      completedSteps,
      message: this.getCompletionMessage(completionPercentage),
      color: this.getCompletionColor(completionPercentage),
    }
  }

  private static isStepCompleted(stepId: string, profile: Profile): boolean {
    switch (stepId) {
      case "avatar":
        return !!profile.avatar_url && !profile.avatar_url.includes("placeholder")
      case "full_name":
        return !!profile.full_name && profile.full_name.trim().length > 0
      case "bio":
        return !!profile.bio && profile.bio.trim().length >= 20
      case "skills":
        return !!profile.skills && profile.skills.length > 0
      case "location":
        return !!profile.location && profile.location.trim().length > 0
      case "hourly_rate":
        return !!profile.hourly_rate && profile.hourly_rate > 0
      case "portfolio":
        return (
          !!profile.portfolio_url &&
          profile.portfolio_url.trim().length > 0 &&
          !profile.portfolio_url.includes("demo-portfolio")
        )
      default:
        return false
    }
  }

  private static getCompletionMessage(percentage: number): string {
    if (percentage >= 90) {
      return "Excelente! O seu perfil está quase perfeito!"
    } else if (percentage >= 80) {
      return "Muito bem! O seu perfil está quase completo."
    } else if (percentage >= 60) {
      return "Bom progresso! Continue a melhorar o seu perfil."
    } else if (percentage >= 40) {
      return "Está no bom caminho! Complete mais alguns passos."
    } else if (percentage >= 20) {
      return "Começou bem! Continue a adicionar informações."
    } else {
      return "Comece a completar o seu perfil para atrair mais clientes!"
    }
  }

  private static getCompletionColor(percentage: number): string {
    if (percentage >= 80) {
      return "green"
    } else if (percentage >= 60) {
      return "blue"
    } else if (percentage >= 40) {
      return "yellow"
    } else {
      return "red"
    }
  }

  // Mock data for demonstration
  static getMockCompletionData(): ProfileCompletionData {
    return {
      completionPercentage: 65,
      totalPoints: 100,
      earnedPoints: 65,
      nextSteps: [
        {
          id: "avatar",
          title: "Adicionar foto de perfil",
          description: "Uma foto profissional aumenta a confiança dos clientes",
          completed: false,
          points: 20,
          priority: 1,
          action: "Carregar foto",
          href: "/dashboard/profile#avatar",
        },
        {
          id: "portfolio",
          title: "Adicionar portfólio",
          description: "Mostre exemplos do seu trabalho",
          completed: false,
          points: 15,
          priority: 7,
          action: "Adicionar portfólio",
          href: "/dashboard/profile#portfolio",
        },
      ],
      completedSteps: [
        {
          id: "full_name",
          title: "Completar nome completo",
          description: "O seu nome completo ajuda na identificação",
          completed: true,
          points: 15,
          priority: 2,
          action: "Adicionar nome",
          href: "/dashboard/profile#name",
        },
        {
          id: "bio",
          title: "Escrever biografia",
          description: "Conte a sua história profissional",
          completed: true,
          points: 15,
          priority: 3,
          action: "Escrever bio",
          href: "/dashboard/profile#bio",
        },
        {
          id: "skills",
          title: "Adicionar competências",
          description: "Liste as suas principais competências técnicas",
          completed: true,
          points: 15,
          priority: 4,
          action: "Adicionar skills",
          href: "/dashboard/profile#skills",
        },
        {
          id: "location",
          title: "Definir localização",
          description: "Ajuda clientes locais a encontrá-lo",
          completed: true,
          points: 10,
          priority: 5,
          action: "Adicionar local",
          href: "/dashboard/profile#location",
        },
        {
          id: "hourly_rate",
          title: "Definir taxa horária",
          description: "Estabeleça o seu valor por hora de trabalho",
          completed: true,
          points: 10,
          priority: 6,
          action: "Definir preço",
          href: "/dashboard/profile#rate",
        },
      ],
      message: "Bom progresso! Continue a melhorar o seu perfil.",
      color: "blue",
    }
  }
}
