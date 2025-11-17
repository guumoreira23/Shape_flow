import { cookies } from "next/headers"
import { lucia } from "@/lib/auth/lucia"
import { TrackerClient } from "./TrackerClient"

export default async function TrackerPage() {
  // Buscar dados do servidor para SSR inicial
  // A validação de autenticação será feita no cliente via /api/auth/check
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value

  let userIsAdmin = false

  // Tentar verificar se é admin se houver sessão (para SSR otimizado)
  if (sessionId) {
    try {
      const validation = await lucia.validateSession(sessionId)
      if (validation.session && validation.user) {
        userIsAdmin = validation.user.role === "admin"
      }
    } catch (error) {
      // Se houver erro, deixar o cliente fazer a validação
      console.error("Erro ao verificar admin no tracker:", error)
    }
  }

  return <TrackerClient userIsAdmin={userIsAdmin} />
}

