import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/permissions"
import postgres from "postgres"

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const DATABASE_URL = process.env.DATABASE_URL

    if (!DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL não configurada" },
        { status: 500 }
      )
    }

    const sql = postgres(DATABASE_URL)

    try {
      // Verificar se a coluna já existe
      const checkColumn = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'theme'
      `

      if (checkColumn.length > 0) {
        await sql.end()
        return NextResponse.json({
          success: true,
          message: "Coluna 'theme' já existe na tabela users",
        })
      }

      // Adicionar coluna theme
      await sql`
        ALTER TABLE users
        ADD COLUMN theme TEXT DEFAULT 'dark'
      `

      // Atualizar registros existentes
      await sql`
        UPDATE users
        SET theme = 'dark'
        WHERE theme IS NULL
      `

      await sql.end()

      return NextResponse.json({
        success: true,
        message: "Migração concluída: coluna 'theme' adicionada à tabela users",
      })
    } catch (error: any) {
      await sql.end()
      console.error("Erro na migração:", error)
      return NextResponse.json(
        {
          error: "Erro ao executar migração",
          details: error.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    if (error.status === 401 || error.message?.includes("admin")) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem executar migrations." },
        { status: 401 }
      )
    }
    console.error("Erro na rota de migração:", error)
    return NextResponse.json(
      { error: "Erro ao executar migração", details: error.message },
      { status: 500 }
    )
  }
}

