import { NextRequest, NextResponse } from "next/server"
import { lucia } from "@/lib/auth/lucia"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null

    if (sessionId) {
      await lucia.invalidateSession(sessionId)
    }

    const sessionCookie = lucia.createBlankSessionCookie()

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
    console.error("Logout error:", error)
    const sessionCookie = lucia.createBlankSessionCookie()
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          "Set-Cookie": sessionCookie.serialize(),
        },
      }
    )
  }
}

