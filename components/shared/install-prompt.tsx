"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, X } from "lucide-react"
import { useTranslations } from "next-intl"

// Define the BeforeInstallPromptEvent interface since it's not standard in TS yet
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: string
    }>;
    prompt(): Promise<void>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const t = useTranslations("InstallPrompt")

    useEffect(() => {
        // Safe check for window and navigator to avoid SSR or exotic browser crashes
        if (typeof window === 'undefined' || !window.navigator) {
            console.log("InstallPrompt: window or navigator undefined");
            return;
        }

        console.log("InstallPrompt: Component mounted, starting checks...");

        // Check if device is iOS safely
        const userAgent = window.navigator.userAgent?.toLowerCase() || "";
        const isIPhoneIPad = /iphone|ipad|ipod/.test(userAgent)
        setIsIOS(isIPhoneIPad)
        console.log("InstallPrompt: isIOS =", isIPhoneIPad);

        // Check if app is already installed safely
        const isAppStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)')?.matches) ||
            ('standalone' in window.navigator && (window.navigator as any).standalone === true)

        setIsStandalone(isAppStandalone)
        console.log("InstallPrompt: isStandalone =", isAppStandalone);

        if (isAppStandalone) {
            console.log("InstallPrompt: App is already standalone, exiting.");
            return;
        }

        // Handle the standard PWA install prompt (Android, Chrome, Edge)
        const handleBeforeInstallPrompt = (e: Event) => {
            console.log("InstallPrompt: beforeinstallprompt event fired! PWA is installable.");
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent)

            // Check if user previously dismissed it recently
            const lastDismissed = localStorage.getItem("biskate-install-dismissed")
            if (lastDismissed) {
                const dismissedTime = parseInt(lastDismissed, 10)
                const now = new Date().getTime()
                // TEMPORARY DEBUG: Set to 0 so it always shows
                if (now - dismissedTime < 0) {
                    console.log("InstallPrompt: Suppressed due to recent dismissal (debug: current limit 0)");
                    return
                }
            }

            // Show our custom UI
            console.log("InstallPrompt: Setting showPrompt to true via event");
            setShowPrompt(true)
        }

        // Check if the event already fired before we could listen
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // DEBUG: Force show after 5 seconds even if event doesn't fire, 
        // just to see the component is working and can render.
        const debugTimer = setTimeout(() => {
            if (!showPrompt) {
                console.log("InstallPrompt: DEBUG - Forcing prompt display after 5s timeout");
                setShowPrompt(true);
            }
        }, 5000);

        // If iOS, show it after a small delay (since iOS doesn't support beforeinstallprompt)
        let iosTimer: NodeJS.Timeout
        if (isIPhoneIPad && !isAppStandalone) {
            console.log("InstallPrompt: iOS detected, setting 3s timer");
            const lastDismissed = localStorage.getItem("biskate-install-dismissed")
            let shouldShow = true

            if (lastDismissed) {
                const dismissedTime = parseInt(lastDismissed, 10)
                const now = new Date().getTime()
                if (now - dismissedTime < 0) {
                    shouldShow = false
                }
            }

            if (shouldShow) {
                iosTimer = setTimeout(() => {
                    console.log("InstallPrompt: Setting showPrompt to true via iOS timer");
                    setShowPrompt(true)
                }, 3000)
            }
        }

        // Cleanup
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            clearTimeout(debugTimer);
            if (iosTimer) clearTimeout(iosTimer)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt && !isIOS) return

        if (deferredPrompt) {
            // Show the native install prompt
            deferredPrompt.prompt()

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt')
                setShowPrompt(false) // Hide our custom prompt
            } else {
                console.log('User dismissed the install prompt')
                handleDismiss()
            }

            // We've used the prompt, and can't use it again, throw it away
            setDeferredPrompt(null)
        } else if (isIOS) {
            // On iOS we can't trigger installation automatically. 
            // The text already guides the user, so we just acknowledge they clicked it.
            // Maybe open the share menu instructions closer.
            alert(t("iosInstructionsDetails") || "Tap the Share button, then 'Add to Home Screen'")
        }
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        // Remember that the user dismissed it so we don't spam them immediately
        localStorage.setItem("biskate-install-dismissed", new Date().getTime().toString())
    }

    if (!showPrompt || isStandalone) return null

    return (
        <div className="fixed top-4 left-4 right-4 z-50 md:top-6 md:left-auto md:right-6 md:w-96 animate-in slide-in-from-top-4 duration-500">
            <Card className="shadow-lg border-indigo-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 overflow-hidden relative">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="p-4 flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <img src="/biskate-icon.png" alt="App Icon" className="w-8 h-8 rounded-lg" onError={(e) => {
                                // Fallback icon if image fails
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }} />
                            <Download className="h-5 w-5 hidden" />
                        </div>
                    </div>

                    <div className="flex-1 pr-6">
                        <h3 className="font-semibold text-gray-900 text-sm">{t("title")}</h3>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                            {isIOS ? t("iosInstructions") : t("description")}
                        </p>

                        {!isIOS && (
                            <div className="mt-3 flex items-center gap-2">
                                <Button
                                    onClick={handleInstallClick}
                                    size="sm"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-8 text-xs font-medium shadow-sm transition-all"
                                >
                                    {t("installButton")}
                                </Button>
                            </div>
                        )}
                        {isIOS && (
                            <div className="mt-2 text-xs text-indigo-600 font-medium">
                                {t("iosHelpTip")}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
