import React from "react"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/">
                        <Logo />
                    </Link>
                    <div className="flex gap-4">
                        <Button variant="ghost" asChild>
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 py-12">
                <div className="container mx-auto px-4 max-w-4xl bg-white p-8 rounded-lg shadow-sm border">
                    {children}
                </div>
            </main>

            <footer className="bg-gray-900 text-gray-400 py-8">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex justify-center gap-6 mb-4 text-sm">
                        <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
                    </div>
                    <p className="text-xs">&copy; {new Date().getFullYear()} GigHub. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
