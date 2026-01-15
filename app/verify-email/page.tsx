"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-indigo-100 p-3 rounded-full mb-4 w-fit">
                        <Mail className="h-8 w-8 text-indigo-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        We've sent a verification link to your email address.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-gray-600">
                        Please click the link in the email to verify your account. Once verified, you can log in to start using GigHub.
                    </p>

                    <div className="pt-4 space-y-3">
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/login">
                                Go to Login
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <p className="text-sm text-gray-500">
                            Didn't receive the email? Check your spam folder.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
