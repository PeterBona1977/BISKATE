"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NotificationsSystem } from "@/components/admin/notifications-system"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Send } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [type, setType] = useState("system")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !content) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSending(true)

      // Buscar todos os IDs de utilizadores para enviar notificação
      const { data: users, error: usersError } = await supabase.from("profiles").select("id")

      if (usersError) throw usersError

      if (!users || users.length === 0) {
        throw new Error("Nenhum utilizador encontrado")
      }

      // Criar notificações para todos os utilizadores
      const notificationsToInsert = users.map((user) => ({
        user_id: user.id,
        title,
        content,
        type,
        read: false,
      }))

      const { error } = await supabase.from("notifications").insert(notificationsToInsert)

      if (error) throw error

      toast({
        title: "Notificação enviada",
        description: `Notificação enviada para ${users.length} utilizadores`,
      })

      // Limpar formulário
      setTitle("")
      setContent("")
      setType("system")
    } catch (error) {
      console.error("Erro ao enviar notificação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sistema de Notificações</h1>
        <p className="text-gray-500 mt-1">Gerencie e envie notificações para os utilizadores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <NotificationsSystem />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Enviar Nova Notificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título da notificação"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Conteúdo da notificação"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">Sistema</SelectItem>
                      <SelectItem value="alert">Alerta</SelectItem>
                      <SelectItem value="user">Utilizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isSending}>
                  {isSending ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para Todos
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
