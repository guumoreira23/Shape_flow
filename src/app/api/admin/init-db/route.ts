import { NextRequest, NextResponse } from "next/server"
import postgres from "postgres"

// Rota temporária para inicializar o banco de dados
// TODO: Remover após configuração inicial
export async function POST(request: NextRequest) {
  try {
    const connectionString = process.env.DATABASE_URL!
    const sql = postgres(connectionString)

    // Criar todas as tabelas
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        hashed_password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS measurement_types (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS measurement_entries (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, date)
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS measurement_values (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        entry_id INTEGER NOT NULL REFERENCES measurement_entries(id) ON DELETE CASCADE,
        measure_type_id INTEGER NOT NULL REFERENCES measurement_types(id) ON DELETE CASCADE,
        value INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(entry_id, measure_type_id)
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        measure_type_id INTEGER NOT NULL REFERENCES measurement_types(id) ON DELETE CASCADE,
        target_value INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, measure_type_id)
      );
    `

    // Criar índices
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_date_unique ON measurement_entries(user_id, date);
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_entry_measure_unique ON measurement_values(entry_id, measure_type_id);
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_measure_goal_unique ON goals(user_id, measure_type_id);
    `

    await sql.end()

    return NextResponse.json({
      success: true,
      message: "Banco de dados inicializado com sucesso",
    })
  } catch (error: any) {
    console.error("Init DB error:", error)
    return NextResponse.json(
      {
        error: "Erro ao inicializar banco de dados",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

