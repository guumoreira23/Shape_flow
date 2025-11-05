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

    const response = NextResponse.json(
      { success: true, sessionId: session.id },
      { status: 200 }
    )

    // Configurar o cookie corretamente usando os atributos do Lucia
    // O Lucia já configura httpOnly, secure, sameSite corretamente
    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      {
        ...sessionCookie.attributes,
        path: "/",
        // Não sobrescrever atributos que o Lucia já configurou
      }
    )

    console.log("Login successful:", {
      userId: user.id,
      email: user.email,
      sessionId: session.id,
      cookieName: sessionCookie.name,
      cookieSet: !!response.cookies.get(sessionCookie.name),
    })

    return response
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

