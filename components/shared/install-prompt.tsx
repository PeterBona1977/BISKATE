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
        const isAppStandalone = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)')?.matches) ||
            (window.navigator && 'standalone' in window.navigator && (window.navigator as any).standalone === true)

        setIsStandalone(isAppStandalone)
        console.log("InstallPrompt: isStandalone =", isAppStandalone);

        if (isAppStandalone) {
            console.log("InstallPrompt: App is already standalone, exiting.");
            return;
        }

        // Handle the standard PWA install prompt (Android, Chrome, Edge)
        const handleBeforeInstallPrompt = (e: any) => {
            console.log("InstallPrompt: beforeinstallprompt received!");
            const event = e.detail || e;
            if (event.preventDefault) event.preventDefault();
            setDeferredPrompt(event);

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

        // Check if the event already fired and was captured globally
        if ((window as any).deferredPrompt) {
            console.log("InstallPrompt: Global deferredPrompt found!");
            handleBeforeInstallPrompt((window as any).deferredPrompt);
        }

        // Listen for the global event OR the custom event we dispatch from layout.tsx
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('pwa-prompt-available', handleBeforeInstallPrompt as any)

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
        console.log("InstallPrompt: Install button clicked. deferredPrompt status:", !!deferredPrompt);

        if (!deferredPrompt && !isIOS) {
            alert("The browser hasn't authorized the installation yet. Please wait a few more seconds or try refreshing. If this persists, the PWA configuration (service worker/manifest) might still be invalid.");
            return;
        }

        if (deferredPrompt) {
            try {
                // Show the native install prompt
                console.log("InstallPrompt: Triggering native prompt...");
                deferredPrompt.prompt()

                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice
                console.log(`InstallPrompt: User choice outcome: ${outcome}`);

                if (outcome === 'accepted') {
                    setShowPrompt(false)
                } else {
                    handleDismiss()
                }

                // We've used the prompt, and can't use it again, throw it away
                setDeferredPrompt(null)
            } catch (err) {
                console.error("InstallPrompt: Error during installation trigger:", err);
            }
        } else if (isIOS) {
            alert(t("iosInstructionsDetails") || "Tap the Share button at the bottom of your browser, then scroll down and tap 'Add to Home Screen'.")
        }
    }

    const handleDismiss = () => {
        console.log("InstallPrompt: User dismissed the prompt.");
        setShowPrompt(false)
        localStorage.setItem("biskate-install-dismissed", new Date().getTime().toString())
    }

    if (!showPrompt || isStandalone) return null

    return (
        <div className="fixed top-4 left-4 right-4 z-[9999] md:top-6 md:left-auto md:right-6 md:w-96 animate-in slide-in-from-top-4 duration-500">
            <Card className="shadow-2xl border-indigo-100 bg-white/98 backdrop-blur-md overflow-hidden relative border-2">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-2 z-10"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="p-5 flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner overflow-hidden">
                            <img src="/biskate-icon.png" alt="App Icon" className="w-full h-full p-1 object-contain" onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }} />
                            <Download className="h-6 w-6 hidden" />
                        </div>
                    </div>

                    <div className="flex-1 pr-4">
                        <h3 className="font-bold text-gray-900 text-base leading-tight">{t("title")}</h3>
                        <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                            {isIOS ? t("iosInstructions") : t("description")}
                        </p>

                        {!isIOS && (
                            <div className="mt-4">
                                <Button
                                    onClick={handleInstallClick}
                                    size="default"
                                    className={`w-full h-10 text-sm font-semibold shadow-md transition-all duration-300 ${deferredPrompt
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                        }`}
                                >
                                    {deferredPrompt ? t("installButton") : "Preparing App..."}
                                </Button>
                                {!deferredPrompt && (
                                    <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                                        Waiting for browser installation ticket...
                                    </p>
                                )}
                            </div>
                        )}
                        {isIOS && (
                            <div className="mt-3 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700 font-medium border border-indigo-100 italic">
                                {t("iosHelpTip")}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
