import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/lucia"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminPanel } from "./AdminPanel"

export default async function AdminPage() {
  try {
    // Verificar sessão primeiro
    const { user, session } = await getSession()

    if (!user || !session) {
      redirect("/login")
    }

    // Sempre buscar role diretamente do banco para garantir precisão
    const dbUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, user.id),
      columns: {
        id: true,
        email: true,
        role: true,
      },
    })

    if (!dbUser) {
      redirect("/login")
    }

    const userIsAdmin = dbUser.role === "admin"

    if (!userIsAdmin) {
      redirect("/dashboard")
    }

    return <AdminPanel userIsAdmin={userIsAdmin} />
  } catch (error: any) {
    // Se o erro for um redirect, apenas propagar
    if (error && typeof error === "object" && "digest" in error) {
      throw error
    }
    console.error("Admin page error:", error)
    redirect("/login")
  }
}

