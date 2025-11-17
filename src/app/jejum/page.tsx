import { cookies } from "next/headers"
import { lucia } from "@/lib/auth/lucia"
import { JejumClient } from "./JejumClient"

export default async function JejumPage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value

  let userIsAdmin = false

  if (sessionId) {
    try {
      const validation = await lucia.validateSession(sessionId)
      if (validation.session && validation.user) {
        userIsAdmin = validation.user.role === "admin"
      }
    } catch (error) {
      console.error("Erro ao verificar admin:", error)
    }
  }

  return <JejumClient userIsAdmin={userIsAdmin} />
}

