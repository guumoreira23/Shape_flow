import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/lucia"
import { AdminPanel } from "./AdminPanel"

export default async function AdminPage() {
  try {
    const { user } = await getSession()
    
    if (!user) {
      redirect("/login")
    }

    // Verificar role diretamente do usuário
    const userIsAdmin = user.role === "admin"

    if (!userIsAdmin) {
      redirect("/dashboard")
    }

    return <AdminPanel userIsAdmin={userIsAdmin} />
  } catch (error) {
    console.error("Admin page error:", error)
    redirect("/login")
  }
}

