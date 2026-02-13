"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Zap, Shield, Heart, Search, Wrench, Home, Car, Laptop, Paintbrush, Book, CheckCircle, Star, AlertCircle, Briefcase, Calendar, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { HeaderUserMenu } from "@/components/shared/header-user-menu"
import { Logo } from "@/components/ui/logo"
import { EmergencyAI } from "@/components/voice/emergency-ai"
import { toast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"
import categoriesData from "@/category_hierarchy.json"

// Feature icons/metadata can stay outside, but content will be localized inside the component
const featureIcons = [<Zap className="h-6 w-6" />, <Shield className="h-6 w-6" />, <Heart className="h-6 w-6" />]

const rootCategories = categoriesData.filter(c => c.parent_id === null)

const getCategoryIcon = (name: string) => {
  switch (name.toUpperCase()) {
    case "AULAS": return <Book className="h-8 w-8" />
    case "CASA": return <Home className="h-8 w-8" />
    case "BEM-ESTAR": return <Heart className="h-8 w-8" />
    case "EMPRESAS": return <Briefcase className="h-8 w-8" />
    case "EVENTOS": return <Calendar className="h-8 w-8" />
    case "OUTROS": return <MoreHorizontal className="h-8 w-8" />
    default: return <Zap className="h-8 w-8" />
  }
}

export default function HomePage() {
  const t = useTranslations("Landing")
  const tc = useTranslations("Common")
  const tf = useTranslations("Footer")
  const { user, profile, loading } = useAuth()
  const isAdmin = profile?.role === "admin"
  const router = useRouter()
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false)

  const handleEmergencySuccess = (requestId: string) => {
    toast({
      title: t("hero.emergency"),
      description: tc("loading"),
    })
    router.push(`/dashboard/emergency/${requestId}`)
  }

  useEffect(() => {
    if (!loading && user) {
      setShowWelcomeBack(true)
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo className="relative z-10" />
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <HeaderUserMenu />
              ) : (
                <>
                  <Button variant="ghost" onClick={() => router.push("/login")}>
                    {tc("login")}
                  </Button>
                  <Button onClick={() => router.push("/register")} className="bg-indigo-600 hover:bg-indigo-700">
                    {tc("register")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Back Section for Logged Users - Not for Admins */}
      {showWelcomeBack && !isAdmin && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1">{t("welcomeBack.title")}</h2>
                <p className="text-green-100">{t("welcomeBack.subtitle")}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => router.push(isAdmin ? "/admin" : "/dashboard")}
                  className="bg-white text-green-600 hover:bg-gray-100"
                >
                  {isAdmin ? t("welcomeBack.goAdmin") : t("welcomeBack.goDashboard")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowWelcomeBack(false)}
                  className="border border-white text-white hover:bg-white/10"
                >
                  {t("welcomeBack.continue")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 px-4 py-2 text-indigo-600 border-indigo-200">
              {t("hero.badge")}
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t.rich("hero.hero_title_main", {
                highlight: (chunks) => <span className="text-indigo-600">{chunks}</span>,
              })}
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                size="lg"
                variant="destructive"
                onClick={() => setIsEmergencyOpen(true)}
                className="bg-red-600 hover:bg-red-700 px-8 py-4 text-lg font-bold shadow-lg shadow-red-200 animate-pulse"
              >
                <Zap className="mr-2 h-5 w-5 fill-current" />
                {t("hero.emergency")}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {!user ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => router.push("/register")}
                    className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-lg"
                  >
                    {t("hero.getStarted")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/login")}
                    className="px-8 py-4 text-lg"
                  >
                    {t("hero.hasAccount")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => router.push("/dashboard/create-gig")}
                    className="bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-lg"
                  >
                    {t("hero.createGig")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/dashboard/provider/gigs")}
                    className="px-8 py-4 text-lg"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    {t("hero.browseGigs")}
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">10k+</div>
                <div className="text-gray-600">{t("stats.completed")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">5k+</div>
                <div className="text-gray-600">{t("stats.activeProviders")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">4.9★</div>
                <div className="text-gray-600">{t("stats.avgRating")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t("features.title")}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {["instant", "secure", "reviews"].map((key, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-indigo-600">
                    {featureIcons[index]}
                  </div>
                  <CardTitle className="text-xl">{t(`features.items.${key}.title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{t(`features.items.${key}.description`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t("howItWorks.title")}</h2>
            <p className="text-xl text-gray-600">{t("howItWorks.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {["step1", "step2", "step3"].map((key, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(`howItWorks.steps.${key}.title`)}</h3>
                <p className="text-gray-600">{t(`howItWorks.steps.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t("categories.title")}</h2>
            <p className="text-xl text-gray-600">{t("categories.subtitle")}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {rootCategories.map((category) => (
              <Link href={`/categories/${category.id}`} key={category.id}>
                <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer group h-full">
                  <CardContent className="p-6">
                    <div className="text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                      <div className="flex justify-center">{getCategoryIcon(category.name)}</div>
                    </div>
                    <h3 className="font-semibold mb-2 text-sm md:text-base">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("cta.title")}</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {user
              ? t("cta.userSubtitle")
              : t("cta.guestSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => router.push("/dashboard/create-gig")}
                  className="px-8 py-4 text-lg bg-white text-indigo-600 hover:bg-gray-100"
                >
                  {t("hero.createGig")}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => router.push(isAdmin ? "/admin" : "/dashboard")}
                  className="px-8 py-4 text-lg border border-white text-white hover:bg-white/10"
                >
                  {isAdmin ? t("welcomeBack.goAdmin") : t("welcomeBack.goDashboard")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => router.push("/register")}
                  className="px-8 py-4 text-lg bg-white text-indigo-600 hover:bg-gray-100"
                >
                  {t("cta.createFreeAccount")}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="px-8 py-4 text-lg border border-white text-white hover:bg-white/10"
                >
                  {tc("login")}
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo size="small" />
              </div>
              <p className="text-gray-400">{tf("description")}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">{tf("forClients.title")}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    {tf("forClients.howItWorks")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {tf("forClients.findGigs")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {tf("forClients.security")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">{tf("forProviders.title")}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    {tf("forProviders.startWorking")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {tf("forProviders.successTips")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {tf("forProviders.helpCenter")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">{tf("company.title")}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    {tf("company.about")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {tf("company.careers")}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    {tf("company.contact")}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-gray-800" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">{tf("copyright")}</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="/legal/privacy" className="text-gray-400 hover:text-white text-sm">
                {tf("legal.privacy")}
              </a>
              <a href="/legal/terms" className="text-gray-400 hover:text-white text-sm">
                {tf("legal.terms")}
              </a>
              <a href="/legal/cookies" className="text-gray-400 hover:text-white text-sm">
                {tf("legal.cookies")}
              </a>
            </div>
          </div>
        </div>
      </footer>
      <EmergencyAI
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        onSuccess={handleEmergencySuccess}
      />
    </div>
  )
}
