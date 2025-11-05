import { NextRequest, NextResponse } from "next/server"
import { lucia } from "@/lib/auth/lucia"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null

    if (sessionId) {
      await lucia.invalidateSession(sessionId)
    }

    const sessionCookie = lucia.createBlankSessionCookie()
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

    // Redirecionar para login após logout
    redirect("/login")
  } catch (error) {
    console.error("Logout error:", error)
    redirect("/login")
  }
}

