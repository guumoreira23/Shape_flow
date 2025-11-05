import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/middleware"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminPanel } from "./AdminPanel"

export default async function AdminPage() {
  try {
    // Garantir autenticação primeiro
    const { user } = await requireAuth()

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
  } catch (error) {
    console.error("Admin page error:", error)
    redirect("/login")
  }
}

