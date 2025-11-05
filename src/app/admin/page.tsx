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
    
    console.log("Admin page - Session check:", {
      hasUser: !!user,
      hasSession: !!session,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
    })

    if (!user || !session) {
      console.log("Admin page - No user or session, redirecting to login")
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

    console.log("Admin page - DB user:", {
      dbUser: dbUser,
      dbRole: dbUser?.role,
      sessionRole: user.role,
    })

    if (!dbUser) {
      console.log("Admin page - No DB user found, redirecting to login")
      redirect("/login")
    }

    const userIsAdmin = dbUser.role === "admin"
    console.log("Admin page - Is admin?", userIsAdmin)

    if (!userIsAdmin) {
      console.log("Admin page - Not admin, redirecting to dashboard")
      redirect("/dashboard")
    }

    return <AdminPanel userIsAdmin={userIsAdmin} />
  } catch (error: any) {
    console.error("Admin page error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    redirect("/login")
  }
}

