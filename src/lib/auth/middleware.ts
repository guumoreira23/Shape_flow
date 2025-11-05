import { redirect } from "next/navigation"
import { getSession } from "./lucia"

export async function requireAuth() {
  try {
    const { user, session } = await getSession()
    
    if (!user || !session) {
      console.log("requireAuth - No user or session")
      redirect("/login")
    }
    
    return { user, session }
  } catch (error: any) {
    console.error("requireAuth error:", error?.message)
    redirect("/login")
  }
}

