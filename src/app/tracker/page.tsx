import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/middleware"
import { isAdmin } from "@/lib/auth/permissions"
import { TrackerClient } from "./TrackerClient"

export default async function TrackerPage() {
  await requireAuth()
  const userIsAdmin = await isAdmin()
  return <TrackerClient userIsAdmin={userIsAdmin} />
}

