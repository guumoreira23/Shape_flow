import { Lucia } from "lucia"
import { adapter } from "./postgres"
import { cookies } from "next/headers"

// LUCIA_SECRET será validado em runtime, não durante build

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      role: attributes.role,
    }
  },
})

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      email: string
      role: string
    }
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null
  
  // Log para debug (temporário para identificar o problema)
  console.log("getSession - Cookie check:", {
    cookieName: lucia.sessionCookieName,
    hasSessionId: !!sessionId,
    sessionIdLength: sessionId?.length || 0,
    allCookies: cookieStore.getAll().map(c => c.name),
  })
  
  if (!sessionId) {
    return {
      user: null,
      session: null,
    }
  }

  const result = await lucia.validateSession(sessionId)
  
  // Log para debug
  console.log("getSession - Validation result:", {
    hasUser: !!result.user,
    hasSession: !!result.session,
    userId: result.user?.id,
    userEmail: result.user?.email,
    userRole: result.user?.role,
  })
  
  try {
    // Apenas atualizar cookie se a sessão for fresh (renovada)
    // Não limpar cookie se a sessão não existir - isso pode ser temporário
    if (result.session && result.session.fresh) {
      const cookieStore = await cookies()
      const sessionCookie = lucia.createSessionCookie(result.session.id)
      cookieStore.set(sessionCookie.name, sessionCookie.value, {
        ...sessionCookie.attributes,
        path: "/",
      })
    }
    // Não definir cookie vazio aqui - isso limpa cookies válidos
    // O cookie vazio só deve ser definido explicitamente no logout
  } catch (error) {
    // Next.js throws error when attempting to set cookies during rendering
    // Isso é normal em Server Components, então apenas logamos em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.error("getSession - Cookie error (expected in some contexts):", error)
    }
  }
  return result
}

export async function requireAuth() {
  try {
    const { user, session } = await getSession()
    if (!user || !session) {
      const error = new Error("Unauthorized") as any
      error.status = 401
      throw error
    }
    return { user, session }
  } catch (error: any) {
    // Se já tem status, re-throw
    if (error.status) {
      throw error
    }
    // Caso contrário, adicionar status 401
    const authError = new Error(error.message || "Unauthorized") as any
    authError.status = 401
    throw authError
  }
}

