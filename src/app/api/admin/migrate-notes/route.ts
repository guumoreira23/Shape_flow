import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/permissions"
import postgres from "postgres"

export async function POST(request: NextRequest) {
  try {
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
      await sql`
        ALTER TABLE measurement_values 
        ADD COLUMN IF NOT EXISTS notes TEXT;
      `

      return NextResponse.json({
        success: true,
        message: "Migration executada com sucesso! Campo 'notes' adicionado à tabela 'measurement_values'",
      })
    } catch (error: any) {
      if (error?.code === "42701") {
        return NextResponse.json({
          success: true,
          message: "Campo 'notes' já existe na tabela 'measurement_values'",
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

