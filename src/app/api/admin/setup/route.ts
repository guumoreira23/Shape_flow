import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { sql } from "drizzle-orm"
import { hashPassword } from "@/lib/auth/password"
import { generateId } from "lucia"

// Rota temporária para setup inicial
// TODO: Remover após configuração inicial
export async function POST(request: NextRequest) {
  try {
    // Verificar se já existe admin
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.role, "admin"),
    })

    if (existingAdmin) {
      return NextResponse.json(
        { message: "Admin já existe", admin: { email: existingAdmin.email } },
        { status: 200 }
      )
    }

    // Primeiro, adicionar coluna role se não existir
    try {
      await db.execute(sql`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
          ) THEN
            ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
          END IF;
        END $$;
      `)
    } catch (error: any) {
      // Coluna pode já existir, ignorar
      console.log("Column role setup:", error.message)
    }

    // Criar admin
    const body = await request.json()
    const email = body.email || "admin@shapeflow.com"
    const password = body.password || "admin123"

    // Verificar se email já existe
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    })

    if (existingUser) {
      // Atualizar para admin
      await db
        .update(users)
        .set({ role: "admin" })
        .where(sql`id = ${existingUser.id}`)

      return NextResponse.json({
        success: true,
        message: "Usuário atualizado para admin",
        email,
      })
    }

    // Criar novo admin
    const hashedPassword = await hashPassword(password)
    const userId = generateId(15)

    await db.insert(users).values({
      id: userId,
      email,
      hashedPassword,
      role: "admin",
    })

    return NextResponse.json({
      success: true,
      message: "Admin criado com sucesso",
      email,
      password: password, // Apenas para setup inicial
    })
  } catch (error: any) {
    console.error("Setup error:", error)
    return NextResponse.json(
      { error: "Erro ao configurar admin", details: error.message },
      { status: 500 }
    )
  }
}

