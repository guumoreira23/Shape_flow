import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/permissions"
import postgres from "postgres"

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário é admin
    await requireAdmin()

    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      return NextResponse.json(
        { error: "DATABASE_URL não configurada" },
        { status: 500 }
      )
    }

    const sql = postgres(connectionString)

    try {
      // Executar migration
      await sql`
        ALTER TABLE goals 
        ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
      `

      return NextResponse.json({
        success: true,
        message: "Migration executada com sucesso! Campo 'deadline' adicionado à tabela 'goals'",
      })
    } catch (error: any) {
      if (error?.code === "42701") {
        // Column already exists
        return NextResponse.json({
          success: true,
          message: "Campo 'deadline' já existe na tabela 'goals'",
        })
      }
      throw error
    } finally {
      await sql.end()
    }
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem executar migrations." },
        { status: 403 }
      )
    }
    console.error("Erro ao executar migration:", error)
    return NextResponse.json(
      { error: error?.message || "Erro ao executar migration" },
      { status: 500 }
    )
  }
}

