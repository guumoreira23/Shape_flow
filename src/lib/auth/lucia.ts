import { Lucia } from "lucia"
import { adapter } from "./postgres"
import { cookies } from "next/headers"

if (!process.env.LUCIA_SECRET) {
  throw new Error("LUCIA_SECRET is not defined")
}

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
    }
  },
})

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      email: string
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
      cookieStore.set(lucia.sessionCookieName, result.session.id, {
        path: ".",
        ...lucia.sessionCookie.attributes,
      })
    }
    if (!result.session) {
      const cookieStore = await cookies()
      cookieStore.set(lucia.sessionCookieName, "", {
        path: ".",
        ...lucia.sessionCookie.attributes,
        maxAge: 0,
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

