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
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null
  if (!sessionId) {
    return {
      user: null,
      session: null,
    }
  }

  const result = await lucia.validateSession(sessionId)
  try {
    if (result.session && result.session.fresh) {
      const cookieStore = await cookies()
      const sessionCookie = lucia.createSessionCookie(result.session.id)
      cookieStore.set(sessionCookie.name, sessionCookie.value, {
        path: ".",
        ...sessionCookie.attributes,
      })
    }
    if (!result.session) {
      const cookieStore = await cookies()
      const sessionCookie = lucia.createBlankSessionCookie()
      cookieStore.set(sessionCookie.name, sessionCookie.value, {
        path: ".",
        ...sessionCookie.attributes,
      })
    }
  } catch {
    // Next.js throws error when attempting to set cookies during rendering
  }
  return result
}

export async function requireAuth() {
  const { user, session } = await getSession()
  if (!user || !session) {
    throw new Error("Unauthorized")
  }
  return { user, session }
}

