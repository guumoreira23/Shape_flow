import { redirect } from "next/navigation"
import { getSession } from "./lucia"

export async function requireAuth() {
  const { user, session } = await getSession()
  if (!user || !session) {
    redirect("/login")
  }
  return { user, session }
}

