"use client"

import React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, ShieldCheck, Clock, Briefcase, Phone, Mail, Lock } from "lucide-react"

interface ProviderProfileSheetProps {
    open: boolean
    onClose: () => void
    provider: {
        full_name?: string | null
        avatar_url?: string | null
        company_name?: string | null
        rating?: number | null
        bio?: string | null
        phone?: string | null
        email?: string | null
        skills?: string[] | null
        years_experience?: number | null
        total_jobs?: number | null
        verified?: boolean | null
    } | null
    quote?: {
        travel_fee?: number
        price_per_hour?: number
        min_hours?: number
        eta?: string
        notes?: string
    } | null
    showContacts?: boolean // only true after payment
}

export function ProviderProfileSheet({
    open, onClose, provider, quote, showContacts = false
}: ProviderProfileSheetProps) {
    if (!provider) return null

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 overflow-y-auto">
                <SheetHeader className="sr-only">
                    <SheetTitle>Perfil do Técnico</SheetTitle>
                </SheetHeader>

                {/* Hero */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 pt-10 pb-8 flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 border-4 border-white/20 mb-4">
                        <AvatarImage src={provider.avatar_url ?? undefined} />
                        <AvatarFallback className="text-2xl font-black bg-red-600 text-white">
                            {provider.full_name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-black text-white">{provider.full_name}</h2>
                    {provider.company_name && (
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {provider.company_name}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-4">
                        {provider.verified && (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                <ShieldCheck className="h-3 w-3 mr-1" /> Verificado
                            </Badge>
                        )}
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            {provider.rating?.toFixed(1) ?? "Novo"}
                        </Badge>
                    </div>
                </div>

                {/* Quote */}
                {quote && (
                    <div className="mx-4 mt-4 bg-red-50 border border-red-100 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-red-500">Deslocação / Taxa de Saída</p>
                                <p className="text-2xl font-black text-red-600">{quote.travel_fee ?? quote.price_per_hour ?? 45}€</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-red-500">Tempo de Chegada</p>
                                <p className="text-xl font-black text-red-600">{quote.eta ?? "—"}</p>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-red-200/50">
                            <p className="text-xs text-red-700 leading-relaxed font-medium">
                                ℹ️ Apenas o valor da deslocação será retido agora. O valor total do problema será orçamentado no local.
                            </p>
                            {quote.notes && (
                                <p className="text-xs text-red-800 italic mt-2">"{quote.notes}"</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
                    {provider.years_experience != null && (
                        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                            <Clock className="h-5 w-5 text-gray-500" />
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Experiência</p>
                                <p className="text-sm font-black">{provider.years_experience} anos</p>
                            </div>
                        </div>
                    )}
                    {provider.total_jobs != null && (
                        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                            <Briefcase className="h-5 w-5 text-gray-500" />
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Trabalhos</p>
                                <p className="text-sm font-black">{provider.total_jobs}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bio */}
                {provider.bio && (
                    <div className="mx-4 mt-4">
                        <p className="text-xs font-bold uppercase text-gray-400 mb-1">Sobre</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{provider.bio}</p>
                    </div>
                )}

                {/* Skills */}
                {provider.skills && provider.skills.length > 0 && (
                    <div className="mx-4 mt-4">
                        <p className="text-xs font-bold uppercase text-gray-400 mb-2">Especialidades</p>
                        <div className="flex flex-wrap gap-2">
                            {provider.skills.map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contacts — shown only after payment */}
                <div className="mx-4 mt-4 mb-8">
                    <p className="text-xs font-bold uppercase text-gray-400 mb-2">Contactos</p>
                    {showContacts ? (
                        <div className="space-y-2">
                            {provider.phone && (
                                <a href={`tel:${provider.phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                    <Phone className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">{provider.phone}</span>
                                </a>
                            )}
                            {provider.email && (
                                <a href={`mailto:${provider.email}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                    <Mail className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">{provider.email}</span>
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Lock className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-500">Contactos disponíveis após aceitação e pagamento</p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
