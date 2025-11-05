import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/lucia"
import { AdminPanel } from "./AdminPanel"

export default async function AdminPage() {
  try {
    const { user, session } = await getSession()
    
    // Se não houver sessão, redirecionar para login
    if (!user || !session) {
      redirect("/login")
    }

    // Verificar role diretamente do usuário
    // Se o role não estiver presente, buscar do banco
    let userRole = user.role
    
    if (!userRole || userRole === "user") {
      // Se não houver role ou for user, verificar no banco
      const { db } = await import("@/db")
      const { users } = await import("@/db/schema")
      const { eq } = await import("drizzle-orm")
      
      const dbUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, user.id),
        columns: {
          role: true,
        },
      })
      
      if (dbUser) {
        userRole = dbUser.role
      }
    }

    const userIsAdmin = userRole === "admin"

    if (!userIsAdmin) {
      // Se não for admin, redirecionar para dashboard
      redirect("/dashboard")
    }

    return <AdminPanel userIsAdmin={userIsAdmin} />
  } catch (error) {
    console.error("Admin page error:", error)
    redirect("/login")
  }
}

