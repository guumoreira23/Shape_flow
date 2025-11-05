import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { lucia } from "@/lib/auth/lucia"
import { registerSchema } from "@/lib/utils/zod"
import { generateId } from "lucia"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

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
      role: "user", // Todos os registros são 'user' por padrão
    })

    const session = await lucia.createSession(userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)

    return NextResponse.json(
      { success: true },
      {
        status: 201,
        headers: {
          "Set-Cookie": sessionCookie.serialize(),
        },
      }
    )
  } catch (error: any) {
    if (error?.name === "ZodError" || error?.issues) {
      const zodError = error.issues || error.errors || []
      const firstError = zodError[0]
      const errorMessage = firstError?.message || "Dados inválidos"
      return NextResponse.json(
        { error: errorMessage, details: zodError },
        { status: 400 }
      )
    }
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: error?.message || "Erro ao criar conta" },
      { status: 500 }
    )
  }
}

