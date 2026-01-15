"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Download, Smartphone, Zap, Wifi, Bell } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if it's already installed
    const checkInstallation = () => {
      const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isInstalled = isStandaloneMode || isIOSStandalone

      setIsStandalone(isInstalled)
      setIsInstalled(isInstalled)
    }

    checkInstallation()

    // Listener for install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)

      // Show prompt after 30 seconds if not installed
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true)
        }
      }, 30000)
    }

    // Listener for when app is installed
    const handleAppInstalled = () => {
      console.log("🎉 PWA installed successfully!")
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("✅ User accepted the installation")
      } else {
        console.log("❌ User rejected the installation")
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error("❌ Error installing PWA:", error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for 7 days
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString())
  }

  // Don't show if already installed or recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-prompt-dismissed")
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < sevenDays) {
        setShowPrompt(false)
      }
    }
  }, [])

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Download className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Install GigHub</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  PWA
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <CardDescription className="text-sm">
            Install GigHub on your device for a faster and more convenient experience!
          </CardDescription>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2 text-green-700">
              <Zap className="h-4 w-4" />
              <span>Faster</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <Wifi className="h-4 w-4" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-700">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </div>
            <div className="flex items-center space-x-2 text-orange-700">
              <Smartphone className="h-4 w-4" />
              <span>Like native app</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleInstallClick} className="flex-1" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
            <Button variant="outline" onClick={handleDismiss} size="sm">
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
