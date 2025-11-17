import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { lucia } from "@/lib/auth/lucia"

// Rota para verificar se o usuário está autenticado
export async function GET() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value

  if (!sessionId) {
    return NextResponse.json({ authenticated: false })
  }

  try {
    const validation = await lucia.validateSession(sessionId)

    if (!validation.session || !validation.user) {
      return NextResponse.json({ authenticated: false })
    }

    const response = NextResponse.json({
      authenticated: true,
      userId: validation.user.id,
      email: validation.user.email,
      role: validation.user.role,
      hasSession: true,
    })

    if (validation.session.fresh) {
      const sessionCookie = lucia.createSessionCookie(validation.session.id)
      response.cookies.set(sessionCookie.name, sessionCookie.value, {
        ...sessionCookie.attributes,
        path: "/",
      })
    }

    return response
  } catch (error: any) {
    return NextResponse.json(
      {
        authenticated: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

