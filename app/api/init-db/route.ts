import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Verificar se os usuários de teste já existem
    const { data: existingUsers } = await supabase
      .from("profiles")
      .select("email")
      .in("email", ["admin@biskate.com", "user@biskate.com"])

    if (existingUsers && existingUsers.length === 2) {
      return NextResponse.json({ message: "Usuários de teste já existem" })
    }

    // Criar usuário admin
    const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: "admin@biskate.com",
      password: "admin123",
      email_confirm: true,
    })

    if (adminAuthError) {
      return NextResponse.json({ error: adminAuthError.message }, { status: 500 })
    }

    if (adminAuthData.user) {
      // Criar perfil admin
      await supabase.from("profiles").insert({
        id: adminAuthData.user.id,
        email: "admin@biskate.com",
        full_name: "Admin BISKATE",
        role: "admin",
        plan: "unlimited",
        responses_used: 0,
        responses_reset_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
    }

    // Criar usuário normal
    const { data: userAuthData, error: userAuthError } = await supabase.auth.admin.createUser({
      email: "user@biskate.com",
      password: "user123",
      email_confirm: true,
    })

    if (userAuthError) {
      return NextResponse.json({ error: userAuthError.message }, { status: 500 })
    }

    if (userAuthData.user) {
      // Criar perfil user
      await supabase.from("profiles").insert({
        id: userAuthData.user.id,
        email: "user@biskate.com",
        full_name: "Utilizador BISKATE",
        role: "user",
        plan: "free",
        responses_used: 0,
        responses_reset_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ message: "Usuários de teste criados com sucesso" })
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    return NextResponse.json({ error: "Erro ao inicializar banco de dados" }, { status: 500 })
  }
}
