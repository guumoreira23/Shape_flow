import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { requireAdmin } from "@/lib/auth/permissions"
import { hashPassword } from "@/lib/auth/password"
import { generateId } from "lucia"
import { z } from "zod"
import { eq } from "drizzle-orm"

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["user", "admin"]).default("user"),
})

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    })

    return NextResponse.json(allUsers)
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Forbidden") ? 403 : 401 }
      )
    }
    console.error("Admin users GET error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(validatedData.password)
    const userId = generateId(15)

    await db.insert(users).values({
      id: userId,
      email: validatedData.email,
      hashedPassword,
      role: validatedData.role || "user",
    })

    return NextResponse.json(
      {
        success: true,
        message: "Usuário criado com sucesso",
        user: {
          id: userId,
          email: validatedData.email,
          role: validatedData.role,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Forbidden") ? 403 : 401 }
      )
    }
    console.error("Admin users POST error:", error)
    return NextResponse.json(
      { error: error?.message || "Erro ao criar usuário" },
      { status: 500 }
    )
  }
}
