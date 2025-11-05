import { getSession } from "./lucia"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export type UserRole = "user" | "admin"

export async function requireAdmin() {
  const { user } = await getSession()
  if (!user) {
    throw new Error("Unauthorized")
  }

  // Buscar role diretamente do banco para garantir precisão
  const dbUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, user.id),
    columns: {
      role: true,
    },
  })

  if (!dbUser || dbUser.role !== "admin") {
    throw new Error("Forbidden - Admin access required")
  }
  return { user }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const { user } = await getSession()
    if (!user) return false

    // Buscar role diretamente do banco para garantir precisão
    const dbUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, user.id),
      columns: {
        role: true,
      },
    })

    return dbUser?.role === "admin"
  } catch {
    return false
  }
}

export async function getUserRole(): Promise<UserRole | null> {
  try {
    const { user } = await getSession()
    if (!user) return null

    // Buscar role diretamente do banco para garantir precisão
    const dbUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, user.id),
      columns: {
        role: true,
      },
    })

    return (dbUser?.role as UserRole) || null
  } catch {
    return null
  }
}

