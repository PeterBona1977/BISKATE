"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, ArrowRight, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { resendVerificationEmail } from "@/app/actions/auth"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const dynamic = "force-dynamic"
export const runtime = "edge"

export default function VerifyEmailPage() {
    const searchParams = useSearchParams()
    // Prefer URL param, but allow user to edit/enter if missing
    const [email, setEmail] = useState(searchParams.get("email") || "")

    // Resend State
    const [isResending, setIsResending] = useState(false)
    const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle")
    const [resendMessage, setResendMessage] = useState("")

    const handleResend = async () => {
        if (!email) {
            setResendStatus("error")
            setResendMessage("Por favor insira o seu email.")
            return
        }

        setIsResending(true)
        setResendStatus("idle")
        setResendMessage("")

        const formData = new FormData()
        formData.append("email", email)

        try {
            const result = await resendVerificationEmail(formData)

            if (result.error) {
                setResendStatus("error")
                setResendMessage(result.error)
            } else {
                setResendStatus("success")
                setResendMessage("Link de verificação reenviado! Verifique o seu email.")
            }
        } catch (error) {
            setResendStatus("error")
            setResendMessage("Ocorreu um erro ao reenviar. Tente novamente.")
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-indigo-100 p-3 rounded-full mb-4 w-fit">
                        <Mail className="h-8 w-8 text-indigo-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Verifique o seu email</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        Enviamos um link de verificação para o seu endereço de email.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-gray-600">
                        <p className="mb-2">
                            Por favor clique no link no email para verificar a sua conta.
                            Uma vez verificada, poderá entrar e começar a usar o Biskate.
                        </p>
                        {email && <p className="font-medium text-gray-900 mt-2">{email}</p>}
                    </div>

                    <div className="pt-2 space-y-3">
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/login">
                                Ir para Login
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="border-t pt-6 mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Não recebeu o email?</h4>

                        <div className="space-y-3">
                            {!email && (
                                <Input
                                    placeholder="Seu email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mb-2"
                                />
                            )}

                            {resendStatus === "success" && (
                                <Alert className="bg-green-50 border-green-200 text-left mb-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800 text-sm">
                                        {resendMessage}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {resendStatus === "error" && (
                                <Alert className="bg-red-50 border-red-200 text-left mb-2">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-800 text-sm">
                                        {resendMessage}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                variant="ghost"
                                className="w-full text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                onClick={handleResend}
                                disabled={isResending || resendStatus === "success"}
                            >
                                {isResending ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        A enviar...
                                    </>
                                ) : resendStatus === "success" ? (
                                    "Email Enviado"
                                ) : (
                                    "Reenviar Email de Confirmação"
                                )}
                            </Button>

                            <p className="text-xs text-gray-500 mt-2">
                                Verifique também a sua caixa de Spam/Lixo Eletrónico.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
