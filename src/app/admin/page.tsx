import { redirect } from "next/navigation"
import { db } from "@/db"
import { requireAdmin } from "@/lib/auth/permissions"
import { AdminDashboard } from "./AdminDashboard"

export default async function AdminPage() {
  try {
    const { user } = await requireAdmin()

    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    })

    const serializedUsers = allUsers.map((item) => ({
      id: item.id,
      email: item.email,
      role: (item.role as "user" | "admin") ?? "user",
      createdAt: item.createdAt?.toISOString() ?? new Date().toISOString(),
    }))

    const totalUsers = serializedUsers.length
    const adminCount = serializedUsers.filter((entry) => entry.role === "admin").length
    const memberCount = totalUsers - adminCount

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)

    const newUsersThisWeek = serializedUsers.filter(
      (entry) => new Date(entry.createdAt) >= sevenDaysAgo
    ).length

    return (
      <AdminDashboard
        currentAdminEmail={user.email}
        currentAdminId={user.id}
        initialUsers={serializedUsers}
        metrics={{
          totalUsers,
          adminCount,
          memberCount,
          newUsersThisWeek,
          lastSync: now.toISOString(),
        }}
      />
    )
  } catch (error: any) {
    // Se o erro for um redirect, apenas propagar
    if (error && typeof error === "object" && "digest" in error) {
      throw error
    }
    console.error("Admin page error:", error)
    if (error instanceof Error && error.message.includes("Forbidden")) {
      redirect("/dashboard")
    }
    redirect("/login")
  }
}

