"use client"

import dynamic from "next/dynamic"
import { PageLoading } from "@/components/ui/page-loading"

// Lazy load dos componentes admin pesados
export const UsersManagement = dynamic(
  () => import("./users-management").then((mod) => ({ default: mod.UsersManagement })),
  {
    loading: () => <PageLoading text="Carregando gestão de utilizadores..." />,
    ssr: false,
  },
)

export const GigsManagement = dynamic(
  () => import("./gigs-management").then((mod) => ({ default: mod.GigsManagement })),
  {
    loading: () => <PageLoading text="Carregando gestão de biskates..." />,
    ssr: false,
  },
)

export const ResponsesManagement = dynamic(
  () => import("./responses-management").then((mod) => ({ default: mod.ResponsesManagement })),
  {
    loading: () => <PageLoading text="Carregando gestão de respostas..." />,
    ssr: false,
  },
)

export const ModerationAlerts = dynamic(
  () => import("./moderation-alerts").then((mod) => ({ default: mod.ModerationAlerts })),
  {
    loading: () => <PageLoading text="Carregando alertas de moderação..." />,
    ssr: false,
  },
)

export const NotificationTriggersManagement = dynamic(
  () => import("./notification-triggers-management").then((mod) => ({ default: mod.NotificationTriggersManagement })),
  {
    loading: () => <PageLoading text="Carregando gestão de notificações..." />,
    ssr: false,
  },
)

export const FeedbackManagement = dynamic(
  () => import("./feedback-management").then((mod) => ({ default: mod.FeedbackManagement })),
  {
    loading: () => <PageLoading text="Carregando gestão de feedback..." />,
    ssr: false,
  },
)

export const AnalyticsDashboard = dynamic(
  () => import("./analytics-dashboard").then((mod) => ({ default: mod.AnalyticsDashboard })),
  {
    loading: () => <PageLoading text="Carregando análises..." />,
    ssr: false,
  },
)

// CMS Components
export const PagesManagement = dynamic(
  () => import("../cms/pages-management").then((mod) => ({ default: mod.PagesManagement })),
  {
    loading: () => <PageLoading text="Carregando gestão de páginas..." />,
    ssr: false,
  },
)

export const SectionsManagement = dynamic(
  () => import("../cms/sections-management").then((mod) => ({ default: mod.SectionsManagement })),
  {
    loading: () => <PageLoading text="Carregando gestão de secções..." />,
    ssr: false,
  },
)

export const MenusManagement = dynamic(
  () => import("../cms/menus-management").then((mod) => ({ default: mod.MenusManagement })),
  {
    loading: () => <PageLoading text="Carregando gestão de menus..." />,
    ssr: false,
  },
)

export const MediaManager = dynamic(
  () => import("../cms/media-manager").then((mod) => ({ default: mod.MediaManager })),
  {
    loading: () => <PageLoading text="Carregando gestor de media..." />,
    ssr: false,
  },
)
