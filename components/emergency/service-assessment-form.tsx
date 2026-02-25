"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Camera, X, Loader2, Euro, UploadCloud } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface ServiceAssessmentFormProps {
    emergencyId: string
    onSubmitted: () => void
}

export function ServiceAssessmentForm({ emergencyId, onSubmitted }: ServiceAssessmentFormProps) {
    const supabase = createClient()
    const [description, setDescription] = useState("")
    const [finalPrice, setFinalPrice] = useState("")
    const [photos, setPhotos] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        setUploading(true)
        try {
            const urls: string[] = []
            for (const file of files) {
                const ext = file.name.split(".").pop()
                const path = `emergency-photos/${emergencyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
                const { error } = await supabase.storage.from("emergency-photos").upload(path, file)
                if (error) throw error
                const { data: { publicUrl } } = supabase.storage.from("emergency-photos").getPublicUrl(path)
                urls.push(publicUrl)
            }
            setPhotos(prev => [...prev, ...urls])
            toast({ title: `${urls.length} foto(s) carregada(s)` })
        } catch (err: any) {
            toast({ title: "Erro no upload", description: err.message, variant: "destructive" })
        } finally {
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ""
        }
    }

    const removePhoto = (url: string) => setPhotos(prev => prev.filter(p => p !== url))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description.trim() || !finalPrice) return
        setSubmitting(true)
        try {
            const res = await fetch("/api/emergency/assessment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emergencyId,
                    description: description.trim(),
                    finalPrice: parseFloat(finalPrice),
                    photos
                })
            })
            if (!res.ok) throw new Error((await res.json()).error)
            toast({ title: "Avaliação enviada!", description: "O cliente será notificado para aceitar ou recusar." })
            onSubmitted()
        } catch (err: any) {
            toast({ title: "Erro", description: err.message, variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <p className="text-xs font-bold uppercase text-gray-400 mb-1.5">Descrição do Problema <span className="text-red-500">*</span></p>
                <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descreva detalhadamente o problema encontrado..."
                    className="min-h-[120px] resize-none"
                    required
                />
            </div>

            <div>
                <p className="text-xs font-bold uppercase text-gray-400 mb-1.5">Valor Final do Serviço <span className="text-red-500">*</span></p>
                <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={finalPrice}
                        onChange={e => setFinalPrice(e.target.value)}
                        placeholder="0.00"
                        className="pl-9"
                        required
                    />
                </div>
            </div>

            {/* Photos */}
            <div>
                <p className="text-xs font-bold uppercase text-gray-400 mb-1.5">Fotografias</p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                    {photos.map(url => (
                        <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100">
                            <img src={url} alt="foto" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removePhoto(url)}
                                className="absolute top-1 right-1 h-5 w-5 bg-black/60 text-white rounded-full flex items-center justify-center"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-400 transition"
                    >
                        {uploading
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : <><Camera className="h-5 w-5 mb-1" /><span className="text-[10px]">Foto</span></>
                        }
                    </button>
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                />
                <p className="text-xs text-gray-400">Fotografe o problema antes de começar o serviço</p>
            </div>

            <Button
                type="submit"
                disabled={submitting || !description.trim() || !finalPrice}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black h-12"
            >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                Enviar Avaliação ao Cliente
            </Button>
        </form>
    )
}
