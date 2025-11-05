import { getSession } from "./lucia"

export type UserRole = "user" | "admin"

export async function requireAdmin() {
  const { user } = await getSession()
  if (!user) {
    throw new Error("Unauthorized")
  }
  if (user.role !== "admin") {
    throw new Error("Forbidden - Admin access required")
  }
  return { user }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const { user } = await getSession()
    return user?.role === "admin"
  } catch {
    return false
  }
}

export async function getUserRole(): Promise<UserRole | null> {
  try {
    const { user } = await getSession()
    return (user?.role as UserRole) || null
  } catch {
    return null
  }
}

