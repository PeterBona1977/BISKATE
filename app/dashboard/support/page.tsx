"use client"

import { FeedbackForm } from "@/components/dashboard/feedback-form"
import { HelpCircle, LifeBuoy, BookOpen, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function SupportPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
                <p className="text-gray-600 mt-2">
                    We're here to help you. Find answers to common questions or get in touch with our team.
                </p>
            </div>

            {/* Quick Help Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-indigo-50">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-lg">Documentation</h3>
                        <p className="text-sm text-gray-500 mt-2">Learn how to use GigHub effectively</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer border-indigo-50">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LifeBuoy className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-lg">Community</h3>
                        <p className="text-sm text-gray-500 mt-2">Join our community of providers and clients</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer border-indigo-50">
                    <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-lg">Safety</h3>
                        <p className="text-sm text-gray-500 mt-2">Your security is our top priority</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Help Center Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-indigo-600" />
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-gray-900">How do I get paid?</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Payments are processed securely through our platform and released after job completion.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">How do I report a problem?</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    You can use the form on this page to report bugs, payment issues, or user misconduct.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Can I change my role?</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Yes, you can apply to become a provider at any time from your dashboard.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-lg text-white shadow-lg">
                        <h3 className="text-lg font-bold mb-2">Need immediate assistance?</h3>
                        <p className="opacity-90 text-sm mb-4">
                            Our priority support is available 24/7 for premium subscribers.
                        </p>
                        <button className="bg-white text-indigo-700 px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors">
                            Upgrade to Premium
                        </button>
                    </div>
                </div>

                {/* Feedback Form */}
                <div>
                    <FeedbackForm />
                </div>
            </div>
        </div>
    )
}
