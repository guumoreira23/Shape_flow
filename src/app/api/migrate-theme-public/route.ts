import { NextRequest, NextResponse } from "next/server"
import postgres from "postgres"

export async function POST(request: NextRequest) {
  try {
    // Verificar token secreto para segurança básica
    const authHeader = request.headers.get("authorization")
    const expectedToken = process.env.MIGRATION_TOKEN || "migration-secret-token-2024"
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Token de autorização inválido" },
        { status: 401 }
      )
    }

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
    console.error("Erro na rota de migração:", error)
    return NextResponse.json(
      { error: "Erro ao executar migração", details: error.message },
      { status: 500 }
    )
  }
}

