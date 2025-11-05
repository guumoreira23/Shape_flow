import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/auth/permissions"
import { AdminPanel } from "./AdminPanel"

export default async function AdminPage() {
  const userIsAdmin = await isAdmin()

  if (!userIsAdmin) {
    redirect("/dashboard")
  }

  return <AdminPanel userIsAdmin={userIsAdmin} />
}

