import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { verifyPassword } from "@/lib/auth/password"
import { lucia } from "@/lib/auth/lucia"
import { loginSchema } from "@/lib/utils/zod"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    })

    if (!user) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    const validPassword = await verifyPassword(
      user.hashedPassword,
      validatedData.password
    )

    if (!validPassword) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    const session = await lucia.createSession(user.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          "Set-Cookie": sessionCookie.serialize(),
        },
      }
    )
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    )
  }
}

