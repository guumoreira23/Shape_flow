import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth/permissions"
import { AdminPanel } from "./AdminPanel"

export default async function AdminPage() {
  try {
    await requireAdmin()
    return <AdminPanel />
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      redirect("/dashboard")
    }
    throw error
  }
}

