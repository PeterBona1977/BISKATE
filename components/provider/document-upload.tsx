"use client"

import type React from "react"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { File, Trash2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Document {
  id: string
  document_type: string
  document_name: string
  document_url: string
  status: string
  rejection_reason?: string
  created_at: string
}

const DOCUMENT_TYPES = {
  id: "Documento de Identificação",
  address: "Comprovativo de Morada",
  certification: "Certificação Profissional",
  portfolio: "Portfolio/Trabalhos",
  other: "Outro",
}

export function DocumentUpload() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedType, setSelectedType] = useState("")

  const fetchDocuments = async () => {
    if (!profile) return

    const { data, error } = await supabase
      .from("provider_documents")
      .select("*")
      .eq("provider_id", profile.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setDocuments(data)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile || !selectedType) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de documento e um arquivo.",
        variant: "destructive",
      })
      return
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Apenas arquivos JPEG, PNG, PDF e WebP são permitidos.",
        variant: "destructive",
      })
      return
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}/${selectedType}/${Date.now()}.${fileExt}`

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("provider-documents")
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100)
          },
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: urlData } = supabase.storage.from("provider-documents").getPublicUrl(fileName)

      // Salvar informações do documento na base de dados
      const { error: dbError } = await supabase.from("provider_documents").insert([
        {
          provider_id: profile.id,
          document_type: selectedType,
          document_name: file.name,
          document_url: urlData.publicUrl,
          status: "pending",
        },
      ])

      if (dbError) throw dbError

      toast({
        title: "Documento enviado",
        description: "O documento foi enviado com sucesso e está aguardando aprovação.",
      })

      // Limpar formulário
      setSelectedType("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Recarregar documentos
      fetchDocuments()
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (documentId: string, documentUrl: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return

    try {
      // Extrair caminho do arquivo da URL
      const urlParts = documentUrl.split("/")
      const fileName = urlParts.slice(-3).join("/") // provider_id/type/filename

      // Deletar do storage
      const { error: storageError } = await supabase.storage.from("provider-documents").remove([fileName])

      if (storageError) throw storageError

      // Deletar da base de dados
      const { error: dbError } = await supabase.from("provider_documents").delete().eq("id", documentId)

      if (dbError) throw dbError

      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso.",
      })

      fetchDocuments()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    } as const

    const labels = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enviar Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tipo de Documento</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Arquivo</label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.webp"
              onChange={handleFileUpload}
              disabled={uploading || !selectedType}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceitos: JPEG, PNG, PDF, WebP. Tamanho máximo: 10MB
            </p>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum documento enviado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <File className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">{doc.document_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {DOCUMENT_TYPES[doc.document_type as keyof typeof DOCUMENT_TYPES]} •{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {doc.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">Motivo da rejeição: {doc.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(doc.status)}
                    <Button variant="outline" size="sm" onClick={() => window.open(doc.document_url, "_blank")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(doc.id, doc.document_url)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
