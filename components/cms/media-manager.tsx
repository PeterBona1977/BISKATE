"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Upload, Trash2, Copy, File, Search } from "lucide-react"

interface MediaFile {
  id: string
  filename: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string
  alt_text: string | null
  description: string | null
  created_at: string
}

export function MediaManager() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("cms_media").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (err) {
      console.error("❌ Erro ao carregar ficheiros:", err)
      toast({
        title: "Erro",
        description: "Erro ao carregar ficheiros de media",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      // Gerar nome único para o ficheiro
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `media/${fileName}`

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage.from("cms-media").upload(filePath, file)

      if (uploadError) throw uploadError

      // Obter URL público
      const {
        data: { publicUrl },
      } = supabase.storage.from("cms-media").getPublicUrl(filePath)

      // Salvar metadados na base de dados
      const { error: dbError } = await supabase.from("cms_media").insert({
        filename: fileName,
        original_name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      })

      if (dbError) throw dbError

      toast({
        title: "Sucesso",
        description: "Ficheiro carregado com sucesso!",
      })

      fetchFiles()
    } catch (err) {
      console.error("❌ Erro ao carregar ficheiro:", err)
      toast({
        title: "Erro",
        description: "Erro ao carregar ficheiro",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const updateFileMetadata = async (fileId: string, metadata: { alt_text?: string; description?: string }) => {
    try {
      const { error } = await supabase.from("cms_media").update(metadata).eq("id", fileId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Metadados atualizados com sucesso!",
      })

      fetchFiles()
      setIsDialogOpen(false)
      setSelectedFile(null)
    } catch (err) {
      console.error("❌ Erro ao atualizar metadados:", err)
      toast({
        title: "Erro",
        description: "Erro ao atualizar metadados",
        variant: "destructive",
      })
    }
  }

  const deleteFile = async (fileId: string, filePath: string) => {
    if (!confirm("Tem certeza que deseja eliminar este ficheiro?")) return

    try {
      // Extrair caminho do storage da URL
      const storagePath = filePath.split("/").slice(-2).join("/")

      // Eliminar do storage
      const { error: storageError } = await supabase.storage.from("cms-media").remove([storagePath])

      if (storageError) throw storageError

      // Eliminar da base de dados
      const { error: dbError } = await supabase.from("cms_media").delete().eq("id", fileId)

      if (dbError) throw dbError

      toast({
        title: "Sucesso",
        description: "Ficheiro eliminado com sucesso!",
      })

      fetchFiles()
    } catch (err) {
      console.error("❌ Erro ao eliminar ficheiro:", err)
      toast({
        title: "Erro",
        description: "Erro ao eliminar ficheiro",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Copiado!",
      description: "URL copiado para a área de transferência",
    })
  }

  const filteredFiles = files.filter(
    (file) =>
      file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const isImage = (mimeType: string) => mimeType.startsWith("image/")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestor de Media</h2>
          <p className="text-gray-600">Gira ficheiros e imagens do site</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar ficheiros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Carregando..." : "Carregar Ficheiro"}
          </Button>
        </div>
      </div>

      {/* Grid de Ficheiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando ficheiros...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-8">
                <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "Nenhum ficheiro encontrado" : "Nenhum ficheiro carregado"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? "Tente pesquisar com outros termos." : "Comece carregando o seu primeiro ficheiro."}
                </p>
                {!searchTerm && (
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Carregar Primeiro Ficheiro
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {isImage(file.mime_type) ? (
                  <img
                    src={file.file_path || "/placeholder.svg"}
                    alt={file.alt_text || file.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <File className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-sm truncate mb-2" title={file.original_name}>
                  {file.original_name}
                </h3>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>{formatFileSize(file.file_size)}</p>
                  <p>{file.mime_type}</p>
                  <p>{new Date(file.created_at).toLocaleDateString("pt-PT")}</p>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(file.file_path)}
                    className="flex-1"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(file)
                      setIsDialogOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteFile(file.id, file.file_path)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Edição de Metadados */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Metadados</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <FileMetadataForm
              file={selectedFile}
              onSave={(metadata) => updateFileMetadata(selectedFile.id, metadata)}
              onCancel={() => {
                setIsDialogOpen(false)
                setSelectedFile(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente do formulário de metadados
function FileMetadataForm({
  file,
  onSave,
  onCancel,
}: {
  file: MediaFile
  onSave: (metadata: { alt_text?: string; description?: string }) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    alt_text: file.alt_text || "",
    description: file.description || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const isImage = file.mime_type.startsWith("image/")

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Preview do ficheiro */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
          {isImage ? (
            <img
              src={file.file_path || "/placeholder.svg"}
              alt={file.alt_text || file.original_name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <File className="h-8 w-8 text-gray-400" />
          )}
        </div>
        <div>
          <h3 className="font-medium">{file.original_name}</h3>
          <p className="text-sm text-gray-500">{file.mime_type}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{isImage ? "Texto Alternativo (Alt Text)" : "Título"}</label>
        <Input
          value={formData.alt_text}
          onChange={(e) => setFormData((prev) => ({ ...prev, alt_text: e.target.value }))}
          placeholder={isImage ? "Descrição da imagem para acessibilidade" : "Título do ficheiro"}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Descrição</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição detalhada do ficheiro"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar Metadados</Button>
      </div>
    </form>
  )
}
