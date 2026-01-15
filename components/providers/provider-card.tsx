"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PremiumBadge, PremiumCardWrapper } from "@/components/subscription/premium-badge"
import { Star, MapPin, Briefcase, Clock, MessageSquare } from "lucide-react"
import Link from "next/link"

export interface ProviderCardData {
    id: string
    full_name: string
    avatar_url?: string
    bio?: string
    location?: string
    skills?: string[]
    rating?: number
    total_reviews?: number
    plan: "free" | "essential" | "pro" | "unlimited"
    provider_verified_at?: string | null
    hourly_rate?: number
    availability?: any
}

interface ProviderCardProps {
    provider: ProviderCardData
    showPremiumHighlight?: boolean
}

export function ProviderCard({ provider, showPremiumHighlight = true }: ProviderCardProps) {
    const isPremium = provider.plan === "pro" || provider.plan === "unlimited"
    const initials = provider.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??"

    const CardComponent = (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={provider.avatar_url} alt={provider.full_name} />
                        <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg truncate">{provider.full_name}</CardTitle>
                            {showPremiumHighlight && <PremiumBadge plan={provider.plan} size="sm" />}
                        </div>

                        <CardDescription className="flex items-center gap-2 mt-1">
                            {provider.location && (
                                <>
                                    <MapPin className="h-3 w-3" />
                                    <span className="text-xs truncate">{provider.location}</span>
                                </>
                            )}
                        </CardDescription>

                        {provider.rating !== undefined && provider.rating > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-semibold">{provider.rating.toFixed(1)}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    ({provider.total_reviews || 0} avaliações)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {provider.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{provider.bio}</p>
                )}

                {provider.skills && provider.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {provider.skills.slice(0, 4).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                            </Badge>
                        ))}
                        {provider.skills.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                                +{provider.skills.length - 4}
                            </Badge>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <div className="flex items-center gap-4">
                        {provider.hourly_rate && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>€{provider.hourly_rate}/h</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Link href={`/providers/${provider.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                            Ver Perfil
                        </Button>
                    </Link>
                    <Link href={`/messages?provider=${provider.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contactar
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )

    if (isPremium && showPremiumHighlight) {
        return <PremiumCardWrapper plan={provider.plan}>{CardComponent}</PremiumCardWrapper>
    }

    return CardComponent
}
