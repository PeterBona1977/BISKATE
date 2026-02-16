"use client"

import { useFormState } from "react-dom"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createOrganizationAction, type CreateOrgState } from "@/app/actions/organizations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Building2, MapPin, Receipt, ShieldCheck } from "lucide-react"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { useTranslations } from "next-intl"

const initialState: CreateOrgState = {
    message: "",
}

export default function CreateOrgPage() {
    const t = useTranslations("Dashboard.Organizations.Create")
    const commonT = useTranslations("Common")
    const router = useRouter()
    const [state, formAction] = useFormState(createOrganizationAction, initialState)

    useEffect(() => {
        if (state.success && state.orgId) {
            setTimeout(() => {
                router.push(`/dashboard/org/${state.orgId}`)
            }, 2000)
        }
    }, [state.success, state.orgId, router])

    return (
        <div className="max-w-2xl mx-auto py-10">
            <Card className="border-none shadow-xl">
                <CardHeader className="bg-slate-50 border-b pb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tight">Criar Organização</CardTitle>
                            <CardDescription>Expanda o seu negócio com uma conta empresarial</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-8">
                    {state.message && (
                        <Alert variant={state.success ? "default" : "destructive"} className={state.success ? "border-green-200 bg-green-50 mb-6" : "mb-6"}>
                            {state.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertDescription className={state.success ? "text-green-800" : ""}>
                                {state.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    <form action={formAction} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="legalName" className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Building2 className="h-3 w-3" />
                                    Nome Legal da Empresa
                                </Label>
                                <Input
                                    id="legalName"
                                    name="legalName"
                                    placeholder="Ex: Tech Solutions Lda"
                                    required
                                    className="h-12 focus:ring-blue-600"
                                />
                                {state.errors?.legalName && (
                                    <p className="text-xs text-red-500 font-medium">{state.errors.legalName[0]}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="vatNumber" className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Receipt className="h-3 w-3" />
                                        NIF / VAT
                                    </Label>
                                    <Input
                                        id="vatNumber"
                                        name="vatNumber"
                                        placeholder="123456789"
                                        required
                                        className="h-12 focus:ring-blue-600"
                                    />
                                    {state.errors?.vatNumber && (
                                        <p className="text-xs text-red-500 font-medium">{state.errors.vatNumber[0]}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="registryCode" className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <ShieldCheck className="h-3 w-3" />
                                        Cód. Certidão Permanente
                                    </Label>
                                    <Input
                                        id="registryCode"
                                        name="registryCode"
                                        placeholder="EX: ABC-123-DEF"
                                        required
                                        className="h-12 focus:ring-blue-600"
                                    />
                                    {state.errors?.registryCode && (
                                        <p className="text-xs text-red-500 font-medium">{state.errors.registryCode[0]}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address" className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    Morada da Sede
                                </Label>
                                <AddressAutocomplete
                                    id="address"
                                    name="address"
                                    placeholder="Av. da Liberdade, 100, Lisboa"
                                    required
                                    className="h-12 focus:ring-blue-600"
                                />
                                {state.errors?.address && (
                                    <p className="text-xs text-red-500 font-medium">{state.errors.address[0]}</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="flex-1 h-12 font-bold uppercase tracking-widest text-xs"
                            >
                                {commonT("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20"
                            >
                                Criar Organização
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
